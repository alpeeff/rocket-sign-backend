import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { IOrder, Order, OrderState, TranslatedOrder } from './order.entity'
import { DataSource, FindOptionsWhere, Repository } from 'typeorm'
import {
  DeliveryType,
  translateDeliveryType,
} from 'src/delivery-type/delivery-type.entity'
import { IUser, UserRole } from 'src/users/user.entity'
import { ApproveOrderDTO, CreateNewOrderDTO, GetOrdersDTO } from './dtos'
import { PaymentsConnector } from 'src/payments/payments.connector'
import { FondyCurrency } from 'src/types/fondy/types'
import {
  ReportType,
  translateReportType,
} from 'src/report-type/report-type.entity'
import { Payment, PaymentState } from 'src/payments/payment.entity'
import { FilesService } from 'src/files/files.service'
import { PaginationOptionsDTO, Pagination } from 'src/pagination/pagination'
import { FileDTO } from 'src/files/types'
import { FileEntity } from 'src/files/file.entity'
import { SendMessageDTO } from 'src/chat/dtos'
import { ChatService } from 'src/chat/chat.service'
import { MAX_ORDER_FILES_LENGTH } from 'src/files/validations'
import { OrderFile } from './order-file.entity'
import { TranslatableRequestDTO } from 'src/translations/dtos'
import { FondyCreateCheckoutResultDTO } from 'src/payments/fondy/dtos'

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(DeliveryType)
    private deliveryTypeRepository: Repository<DeliveryType>,
    @InjectRepository(ReportType)
    private reportTypeRepository: Repository<ReportType>,
    @InjectRepository(OrderFile)
    private orderFileRepository: Repository<OrderFile>,
    @InjectDataSource() private dataSource: DataSource,
    private paymentsConnector: PaymentsConnector,
    private filesService: FilesService,
    private chatService: ChatService,
  ) {}

  async createNewOrder(
    newOrder: CreateNewOrderDTO,
    creator: IUser,
  ): Promise<FondyCreateCheckoutResultDTO> {
    const [deliveryType, reportType] = await Promise.all([
      this.getDeliveryType(newOrder.deliveryType, newOrder),
      this.getReportType(newOrder.reportType, newOrder),
    ])

    if (!deliveryType || !reportType) {
      throw new BadRequestException()
    }

    const amount = reportType.price + deliveryType.price

    const description = deliveryType.name + ' & ' + reportType.name

    const { payment, checkout } = await this.paymentsConnector.create({
      amount: amount,
      currency: FondyCurrency.USD,
      desc: description,
      email: creator.email,
    })

    const order = this.orderRepository.create({
      deliveryType: deliveryType,
      reportType: reportType,
      sign: newOrder.sign,
      state: OrderState.InModeration,
      user: creator,
      deliveryTypePrice: deliveryType.price,
      reportTypePrice: reportType.price,
      payment,
    })

    try {
      await this.orderRepository.save(order)

      return checkout
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async get(getOrdersDto: GetOrdersDTO, user: IUser) {
    const where: FindOptionsWhere<IOrder> = {
      user,
      state: getOrdersDto.state,
    }

    if (user.role === UserRole.Soldier) {
      where.user = undefined

      if (where.state !== OrderState.WaitingForExecutor) {
        where.executor = user
      }
    }

    try {
      const [results, count] = await this.orderRepository.findAndCount({
        where,
        take: getOrdersDto.limit,
        skip: getOrdersDto.page * getOrdersDto.limit,
        relations: {
          deliveryType: {
            translations: true,
          },
          reportType: {
            translations: true,
          },
          files: {
            file: {
              owners: true,
            },
          },
        },
      })

      const translatedOrders: TranslatedOrder[] = results.map((x) => {
        const { deliveryType, reportType, ...rest } = x

        const files = x.files.filter(
          (y) => y.file.owners.findIndex((z) => z.id === user.id) !== -1,
        )

        return {
          ...rest,
          files,
          reportType: translateReportType(
            reportType,
            getOrdersDto.languageCode,
          ),
          deliveryType: translateDeliveryType(
            deliveryType,
            getOrdersDto.languageCode,
          ),
        }
      })

      return new Pagination<TranslatedOrder>({
        results: translatedOrders,
        total: count,
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async getFeed(options: PaginationOptionsDTO): Promise<Pagination<IOrder>> {
    try {
      const [results, count] = await this.orderRepository.findAndCount({
        where: { state: OrderState.Done, published: true },
        take: options.limit,
        skip: options.page * options.limit,
      })

      return new Pagination<IOrder>({
        results,
        total: count,
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async takeInProgress(order: IOrder, executor: IUser) {
    try {
      await this.orderRepository.update(
        { id: order.id },
        { state: OrderState.InProgress, executor },
      )
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async approveOrder(order: IOrder, approveOrderDto: ApproveOrderDTO) {
    try {
      await this.paymentsConnector.capture(order.payment)

      await this.orderRepository.update(
        { id: order.id },
        { state: OrderState.Done },
      )

      if (approveOrderDto.publish) {
        const files = await this.filesService.get(
          order.files.map((x) => x.file.id),
        )
        await this.filesService.publish(files)
      }
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async approveSoldierOrder(order: IOrder) {
    if (!order.files.length) {
      throw new BadRequestException('Attach files to approve completeness')
    }

    await this.orderRepository.update(
      { id: order.id },
      {
        state: OrderState.WaitingForApproveFromCreator,
        completedAt: new Date(),
      },
    )

    const files = await this.filesService.get(order.files.map((x) => x.file.id))
    await this.filesService.addOwner(files, order.user)
  }

  async reapproveSoldierOrder(user: IUser, order: IOrder, files: FileDTO[]) {
    await this.attachFiles(user, order, files)
    await this.approveSoldierOrder(order)
  }

  async cancelOrder(order: IOrder) {
    try {
      await this.paymentsConnector.reverse(order.payment)

      await this.orderRepository.update(
        { id: order.id },
        { state: OrderState.CancelledByExecutor },
      )
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async getOrdersPaymentSumByUser(user: IUser) {
    const ordersQueryBuilder = this.dataSource.createQueryBuilder(
      Order,
      'order',
    )

    try {
      const data = await ordersQueryBuilder
        .select('SUM(payment.amount)', 'balance')
        .where(
          `order.userId = '${user.id}' AND order.state = '${OrderState.Done}'`,
        )
        .leftJoin(
          Payment,
          'payment',
          `payment.id = order.paymentId AND payment.state = '${PaymentState.OnPaymentSystemAccount}'`,
        )
        .getRawOne<{ balance: number | null }>()

      return { balance: data.balance / 100 || 0 }
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async attachFiles(user: IUser, order: IOrder, files: FileDTO[]) {
    if (order.files.length + files.length > MAX_ORDER_FILES_LENGTH) {
      throw new BadRequestException('Remove uploaded files and try again')
    }

    const ids = await Promise.all(
      files.map(({ buffer, contentType }, i) =>
        this.filesService.upload(
          user,
          `${order.id}_${i + order.files.length}`,
          buffer,
          contentType,
        ),
      ),
    )

    const orderFile = new OrderFile()
    orderFile.order = order
    orderFile.file = ids[0]

    await this.orderFileRepository.save(orderFile)
  }

  async deleteAttachment(file: FileEntity) {
    await this.filesService.delete(file.id)
  }

  async appeal(user: IUser, order: IOrder, sendMessageDto: SendMessageDTO) {
    await this.orderRepository.update(
      { id: order.id },
      { state: OrderState.Appeal },
    )

    await this.chatService.send(user, order, sendMessageDto)
  }

  async orderExistsForUser(orderId: string, user: IUser) {
    const where: FindOptionsWhere<Order> = { id: orderId }

    if (user.role === UserRole.Default) {
      where.user = user
    }

    const orderExistsForUser = await this.orderRepository.findOne({
      where,
      relations: {
        executor: true,
        user: true,
        payment: true,
        files: true,
      },
    })

    return orderExistsForUser
  }

  async orderExists(orderId: string) {
    const orderExists = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        executor: true,
        user: true,
        files: true,
      },
    })

    return orderExists
  }

  async getDeliveryTypes(translatableRequestDto: TranslatableRequestDTO) {
    const deliveryTypes = await this.deliveryTypeRepository.find({
      relations: { translations: true },
    })

    return deliveryTypes.map((x) =>
      translateDeliveryType(x, translatableRequestDto.languageCode),
    )
  }

  async getDeliveryType(
    id: DeliveryType['id'],
    translatableRequestDto: TranslatableRequestDTO,
  ) {
    const deliveryType = await this.deliveryTypeRepository.findOne({
      where: { id },
      relations: { translations: true },
    })

    return translateDeliveryType(
      deliveryType,
      translatableRequestDto.languageCode,
    )
  }

  async getReportTypes(translatableRequestDto: TranslatableRequestDTO) {
    const reportTypes = await this.reportTypeRepository.find({
      relations: {
        translations: true,
      },
    })

    return reportTypes.map((x) =>
      translateReportType(x, translatableRequestDto.languageCode),
    )
  }

  async getReportType(
    id: ReportType['id'],
    translatableRequestDto: TranslatableRequestDTO,
  ) {
    const reportType = await this.reportTypeRepository.findOne({
      where: { id },
      relations: {
        translations: true,
      },
    })

    return translateReportType(reportType, translatableRequestDto.languageCode)
  }
}
