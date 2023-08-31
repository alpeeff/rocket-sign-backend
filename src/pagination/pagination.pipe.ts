import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common'

@Injectable()
export class PaginationTransformQueryPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const pipe = new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })

    return pipe.transform(value, metadata)
  }
}
