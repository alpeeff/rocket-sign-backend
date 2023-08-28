import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { Request } from 'express'
import { IOrder, Order } from './order.entity'
import { Action } from 'src/casl/casl-ability.factory'
import { CreateNewOrderDTO, GetOrdersDTO } from './dtos'
import { FilesInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { CheckOrderPolicies, OrderExistsGuard } from './orders.guard'
import { OrderFilesParam, OrderParam } from './orders.decorator'
import { Pagination, PaginationOptionsDTO } from 'src/pagination/pagination'
import { FilesGuard } from 'src/files/files.guard'
import { FileParam } from 'src/files/files.decorator'
import { FileEntity } from 'src/files/file.entity'
import { FileDTO } from 'src/files/types'
import { MAX_ORDER_FILES_LENGTH } from 'src/files/validations'
import { FondyCheckoutIntermediateSuccessResponseDTO } from 'cloudipsp-node-js-sdk'

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * @description Retrieves user's paginated orders
   *
   * User with {UserRole.Default} can see all created orders
   *
   * User with {UserRole.Soldier} can see order in {OrderState.WaitingForExecutor} state and orders where {order.executor = user}
   *
   */
  @Get()
  @AuthGuard((ability) => ability.can(Action.Read, Order))
  async get(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    getOrdersDto: GetOrdersDTO,
    @Req() req: Request,
  ): Promise<Pagination<IOrder>> {
    return await this.ordersService.get(getOrdersDto, req.user)
  }

  /**
   * @description Creates order
   *
   * User with {UserRole.Default} only can create orders
   *
   * @returns  Returns fondy checkout
   *
   */
  @Post()
  @AuthGuard((ability) => ability.can(Action.Create, Order))
  async create(
    @Body(new ValidationPipe()) createNewOrderDto: CreateNewOrderDTO,
    @Req() req: Request,
  ): Promise<FondyCheckoutIntermediateSuccessResponseDTO> {
    const { checkout } = await this.ordersService.createNewOrder(
      createNewOrderDto,
      req.user,
    )

    return checkout
  }

  /**
   * @description Retrieves published paginated orders
   */
  @Get('feed')
  async getFeed(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    options: PaginationOptionsDTO,
  ): Promise<Pagination<IOrder>> {
    return await this.ordersService.getFeed(options)
  }

  /**
   * @description Changes order's state {OrderState.WaitingForExecutor} -> {OrderState.InProgress}
   * and sets {order.executor = user}
   *
   * User with {UserRole.Soldier} can accept order.
   *
   */
  @Post('take/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.TakeInProgress)
  @AuthGuard()
  async takeInProgress(@OrderParam() order: IOrder, @Req() req: Request) {
    return await this.ordersService.takeInProgress(order.id, req.user)
  }

  /**
   * @description Changes order's state {OrderState.WaitingForApproveFromCreator} -> {OrderState.Done}
   *
   * User with {UserRole.Default} can approve order.
   *
   */
  @Post('approve/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.ApproveFromCreator)
  @AuthGuard()
  async approve(@OrderParam() order: Order, @Req() req: Request) {
    await this.ordersService.approveOrder(order.id, req.user)
  }

  /**
   * @description Changes order's state {OrderState.InProgress} -> {OrderState.WaitingForApproveFromCreator}
   * and sets {order.executor = user}
   *
   * User with {UserRole.Soldier} should attach minimum 1 file to approve order completeness.
   *
   */
  @Post('approve-soldier/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.ApproveFromExecutor)
  @AuthGuard()
  async approveSoldier(@OrderParam() order: IOrder, @Req() req: Request) {
    await this.ordersService.approveSoldierOrder(order.id, req.user)
  }

  /**
   * @description Attaches files to order
   *
   */
  @Post('file/:orderId')
  @UseInterceptors(FilesInterceptor('attachments'))
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.AttachFiles)
  @AuthGuard()
  async uploadAttachments(
    @OrderParam() order: Order,
    @OrderFilesParam() files: FileDTO[],
    @Req() req: Request,
  ) {
    if (order.files.length >= MAX_ORDER_FILES_LENGTH) {
      throw new BadRequestException(
        `You cannot upload more than ${MAX_ORDER_FILES_LENGTH} files`,
      )
    }

    await this.ordersService.attachFiles(req.user, order, files)
  }

  /**
   * @description Deletes attachment from order
   *
   */
  @Delete('file/:orderId/:fileId')
  @UseGuards(FilesGuard)
  @UseGuards(OrderExistsGuard)
  @AuthGuard()
  async getOrderFile(
    @FileParam() file: FileEntity,
    @OrderParam() order: Order,
  ) {
    await this.ordersService.deleteAttachment(order, file)
  }
}
