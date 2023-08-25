import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { Request } from 'express'
import { Order } from './order.entity'
import { Action } from 'src/casl/casl-ability.factory'
import { CreateNewOrderDTO, GetOrdersDTO } from './dtos'
import { FilesInterceptor } from '@nestjs/platform-express'
import { SharpPipe } from 'src/helpers/pipes/sharp.pipe'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { CheckOrderPolicies, OrderExistsGuard } from './orders.guard'
import { OrderParam } from './orders.decorator'
import { PaginationOptionsDTO } from 'src/pagination/pagination'
import { FilesGuard } from 'src/files/files.guard'
import { FileParam } from 'src/files/files.decorator'
import { FileEntity } from 'src/files/file.entity'
import { FilesService } from 'src/files/files.service'
import { FileDTO } from 'src/files/types'

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private filesService: FilesService,
  ) {}

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
  ) {
    return await this.ordersService.get(getOrdersDto, req.user)
  }

  @Post()
  @AuthGuard((ability) => ability.can(Action.Create, Order))
  async create(
    @Body(new ValidationPipe()) createNewOrderDto: CreateNewOrderDTO,
    @Req() req: Request,
  ) {
    return await this.ordersService.createNewOrder(createNewOrderDto, req.user)
  }

  @Get('feed')
  async getFeed(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    options: PaginationOptionsDTO,
  ) {
    return await this.ordersService.getFeed(options)
  }

  @Post('take/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.TakeInProgress)
  @AuthGuard()
  async takeInProgress(@OrderParam() order: Order, @Req() req: Request) {
    return await this.ordersService.takeInProgress(order.id, req.user)
  }

  @Post('approve/:orderId')
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.ApproveFromExecutor)
  @AuthGuard()
  async approveCompleteness(@OrderParam() order: Order, @Req() req: Request) {
    await this.ordersService.approveOrderCompleteness(order.id, req.user)
  }

  @Post('attach/:orderId')
  @UseInterceptors(FilesInterceptor('attachments'))
  @UseGuards(OrderExistsGuard)
  @CheckOrderPolicies(Action.AttachFiles)
  @AuthGuard()
  async uploadAttachments(
    @OrderParam() order: Order,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|heic|mp4)$/,
          }),
        ],
      }),
      new SharpPipe(),
    )
    files: FileDTO[],
  ) {
    await this.ordersService.attachFiles(order, files)
  }

  @Get('file/:fileId')
  @UseGuards(FilesGuard)
  @AuthGuard()
  async getOrderFile(@FileParam() file: FileEntity) {
    const { buffer, contentType } = await this.filesService.get(file.id)
    return new StreamableFile(buffer, { type: contentType })
  }
}
