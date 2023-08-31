import {
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
import { Action, CaslAbilityFactory } from 'src/casl/casl-ability.factory'
import { ApproveOrderDTO, CreateNewOrderDTO, GetOrdersDTO } from './dtos'
import { FilesInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import {
  CheckOrderPolicies,
  OrderExistsGuard,
  OrderFileLengthGuard,
} from './orders.guard'
import { OrderFilesParam, OrderParam } from './orders.decorator'
import { Pagination, PaginationOptionsDTO } from 'src/pagination/pagination'
import { FilesGuard } from 'src/files/files.guard'
import { FileParam } from 'src/files/files.decorator'
import { FileEntity } from 'src/files/file.entity'
import { FileDTO } from 'src/files/types'
import { FondyCheckoutIntermediateSuccessResponseDTO } from 'cloudipsp-node-js-sdk'
import { SendMessageDTO } from 'src/chat/dtos'
import { PaginationTransformQueryPipe } from 'src/pagination/pagination.pipe'

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private casl: CaslAbilityFactory,
  ) {}

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
    @Query(new PaginationTransformQueryPipe())
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
    @Query(new PaginationTransformQueryPipe())
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
    return await this.ordersService.takeInProgress(order, req.user)
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
  async approve(
    @OrderParam() order: IOrder,
    @Body(new ValidationPipe()) approveOrderDto: ApproveOrderDTO,
  ) {
    await this.ordersService.approveOrder(order, approveOrderDto)
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
  async approveSoldier(@OrderParam() order: IOrder) {
    await this.ordersService.approveSoldierOrder(order)
  }

  /**
   * @description Changes order's state {OrderState.InProgress} -> {OrderState.WaitingForApproveFromCreator}
   * and sets {order.executor = user}
   *
   * User with {UserRole.Soldier} should attach minimum 1 file to approve order completeness.
   *
   */
  @Post('reapprove-soldier/:orderId')
  @UseInterceptors(FilesInterceptor('attachments'))
  @UseGuards(OrderExistsGuard, OrderFileLengthGuard)
  @CheckOrderPolicies(Action.ApproveFromExecutor)
  @AuthGuard()
  async reApproveSoldier(
    @OrderParam() order: IOrder,
    @OrderFilesParam() files: FileDTO[],
    @Req() req: Request,
  ) {
    await this.ordersService.reapproveSoldierOrder(req.user, order, files)
  }

  /**
   * @description Attaches files to order
   *
   */
  @Post('file/:orderId')
  @UseInterceptors(FilesInterceptor('attachments'))
  @UseGuards(OrderExistsGuard, OrderFileLengthGuard)
  @CheckOrderPolicies(Action.AttachFiles)
  @AuthGuard()
  async uploadAttachments(
    @OrderParam() order: IOrder,
    @OrderFilesParam() files: FileDTO[],
    @Req() req: Request,
  ) {
    await this.ordersService.attachFiles(req.user, order, files)
  }

  /**
   * @description Deletes attachment from order
   *
   */
  @Delete('file/:orderId/:fileId')
  @UseGuards(FilesGuard)
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.DeleteAttachment)
  @AuthGuard()
  async deleteAttachment(@FileParam() file: FileEntity) {
    await this.ordersService.deleteAttachment(file)
  }

  /**
   * @description Cancels order execution
   *
   * User with {UserRole.Soldier} can cancel order execution when order state is
   * in {OrderState.InProgress, OrderState.WaitingForApproveFromCreator}
   *
   */
  @Post('cancel/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.CancelExecution)
  @AuthGuard()
  async cancelOrder(@OrderParam() order: IOrder) {
    await this.ordersService.cancelOrder(order)
  }

  /**
   * @description Starts order appeal proccess
   *
   * User with {UserRole.Default} can start appeal proccess if order is in {OrderState.WaitingForApproveFromCreator}
   * and attach first message of conversation
   *
   */
  @Post('appeal/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.AppealOrder)
  @AuthGuard()
  async appeal(
    @OrderParam() order: IOrder,
    @Body(new ValidationPipe()) sendMessageDto: SendMessageDTO,
    @Req() req: Request,
  ) {
    await this.ordersService.appeal(req.user, order, sendMessageDto)
  }
}
