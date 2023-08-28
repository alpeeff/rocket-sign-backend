import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { IOrder, Order, OrderState } from './order.entity'
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
import { FondyCreateCheckoutResultDTO } from 'src/payments/fondy/dtos'

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

  async createNewOrder(
    newOrder: CreateNewOrderDTO,
    creator: IUser,
  ): Promise<FondyCreateCheckoutResultDTO> {
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

    const { payment, checkout } = await this.paymentsConnector.create({
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
      await this.orderRepository.save(order)
      return checkout
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

      return new Pagination<IOrder>({
        results,
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

  async approveOrder(order: IOrder) {
    try {
      await this.paymentsConnector.capture(order.payment)

      await this.orderRepository.update(
        { id: order.id },
        { state: OrderState.Done },
      )
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
      { state: OrderState.WaitingForApproveFromCreator },
    )
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

  async deleteAttachment(order: Order, file: FileEntity) {
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
