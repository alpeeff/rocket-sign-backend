import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Order, OrderState } from './order.entity'
import { DataSource, FindOptionsWhere, Repository } from 'typeorm'
import { DeliveryType } from 'src/delivery-type/delivery-type.entity'
import { IUser, UserRole } from 'src/users/user.entity'
import { CreateNewOrderDTO, GetOrdersDTO } from './dtos'
import { PaymentsConnector } from 'src/payments/payments.connector'
import { FondyCurrency } from 'src/types/fondy/types'
import { ReportType } from 'src/report-type/report-type.entity'
import { Payment, PaymentState } from 'src/payments/payment.entity'
import { FilesService } from 'src/files/files.service'
import { PaginationOptionsDTO, Pagination } from 'src/pagination/pagination'
import { FileDTO } from 'src/files/types'
import { FileEntity } from 'src/files/file.entity'

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(DeliveryType)
    private deliveryTypeRepository: Repository<DeliveryType>,
    @InjectRepository(ReportType)
    private reportTypeRepository: Repository<ReportType>,
    @InjectDataSource() private dataSource: DataSource,
    private paymentsConnector: PaymentsConnector,
    private filesService: FilesService,
  ) {}

  async createNewOrder(newOrder: CreateNewOrderDTO, creator: IUser) {
    const [deliveryType, reportType] = await Promise.all([
      this.deliveryTypeRepository.findOneBy({
        id: newOrder.deliveryType,
      }),

      this.reportTypeRepository.findOneBy({
        id: newOrder.reportType,
      }),
    ])

    if (!deliveryType || !reportType) {
      throw new BadRequestException()
    }

    const amount = reportType.price + deliveryType.price

    const payment = await this.paymentsConnector.create({
      amount: amount,
      currency: FondyCurrency.UAH,
      desc: deliveryType.name,
      email: creator.email,
    })

    const order = this.orderRepository.create({
      deliveryType: deliveryType.id,
      reportType: reportType.id,
      sign: newOrder.sign,
      state: OrderState.InModeration,
      user: creator,
      payment,
    })

    try {
      return await this.orderRepository.save(order)
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async get(getOrdersDto: GetOrdersDTO, user: IUser) {
    try {
      const where: FindOptionsWhere<Order> =
        user.role === UserRole.Soldier
          ? {
              executor:
                getOrdersDto.state === OrderState.WaitingForExecutor
                  ? undefined
                  : user,
            }
          : { user }

      where.state = getOrdersDto.state

      const [results, count] = await this.orderRepository.findAndCount({
        where,
        take: getOrdersDto.limit,
        skip: getOrdersDto.page * getOrdersDto.limit,
      })

      return new Pagination<Order>({
        results,
        total: count,
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async getFeed(options: PaginationOptionsDTO): Promise<Pagination<Order>> {
    try {
      const [results, count] = await this.orderRepository.findAndCount({
        where: { state: OrderState.Done, published: true },
        take: options.limit,
        skip: options.page * options.limit,
      })

      return new Pagination<Order>({
        results,
        total: count,
      })
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async takeInProgress(orderId: string, whoAccepts: IUser) {
    const orderExists = await this.orderRepository.findOneBy({
      id: orderId,
    })

    if (!orderExists) {
      throw new BadRequestException(`Order with id: ${orderId} doesn't exist!`)
    }

    try {
      await this.orderRepository.update(
        { id: orderExists.id },
        { state: OrderState.InProgress, executor: whoAccepts },
      )
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async approveOrder(orderId: string, user: IUser) {
    const orderExists = await this.orderRepository.findOne({
      where: { id: orderId, user },
      relations: { payment: true },
    })

    if (orderExists.state !== OrderState.WaitingForApproveFromCreator) {
      throw new BadRequestException(
        `Order isn't in ${
          OrderState[OrderState.WaitingForApproveFromCreator]
        } state`,
      )
    }

    try {
      await this.paymentsConnector.capture(orderExists.payment)

      await this.orderRepository.update(
        { id: orderExists.id },
        { state: OrderState.Done },
      )
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async approveSoldierOrder(orderId: string, user: IUser) {
    const orderExists = await this.orderRepository.findOneBy({
      id: orderId,
      executor: user,
    })

    if (!orderExists) {
      throw new NotFoundException(`Order doesn't exist`)
    }

    if (!orderExists.files.length) {
      throw new BadRequestException('Attach files to approve completeness')
    }

    await this.orderRepository.update(
      { id: orderExists.id },
      { state: OrderState.WaitingForApproveFromCreator },
    )
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
          `payment.id = order.paymentId AND payment.state = '${PaymentState.InSystem}'`,
        )
        .getRawOne<{ balance: number | null }>()

      return { balance: data.balance / 100 || 0 }
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  async attachFiles(user: IUser, order: Order, files: FileDTO[]) {
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

    await this.orderRepository.update(
      { id: order.id },
      { files: order.files.concat(ids) },
    )
  }

  async deleteFile(order: Order, file: FileEntity) {
    await this.filesService.delete(file.id)

    await this.orderRepository.update(
      { id: order.id },
      { files: order.files.filter((fileId) => fileId !== file.id) },
    )
  }

  async orderExistsForUser(orderId: string, user: IUser) {
    const orderExistsForUser = await this.orderRepository.findOne({
      where: { id: orderId, user },
      relations: {
        executor: true,
        user: true,
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
}
