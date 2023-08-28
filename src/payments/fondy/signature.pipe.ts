import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import * as fondyUtils from 'cloudipsp-node-js-sdk/lib/util'
import { decode, isValid } from 'js-base64'
import { ConfigService } from 'src/config/config.service'
import {
  FondyCallbackRequestDTO,
  FondyCallbackRequestWithSignatureDTO,
} from './dtos'

@Injectable()
export class FondySignaturePipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(
    value: FondyCallbackRequestDTO,
  ): FondyCallbackRequestWithSignatureDTO {
    let callbackRequest: FondyCallbackRequestWithSignatureDTO
    let generatedSignature: string
    const secretKey = this.configService.get('FONDY_SECRET_KEY')

    if ('data' in value) {
      if (!isValid(value.data)) {
        throw new BadRequestException("Sent data isn't valid")
      }

      const parsedData = JSON.parse(decode(value.data)) as {
        order: FondyCallbackRequestWithSignatureDTO
      }

      generatedSignature = fondyUtils.genSignatureV2(value.data, secretKey)
      callbackRequest = parsedData.order
    } else {
      generatedSignature = fondyUtils.genSignature(value, secretKey)
      callbackRequest = value
    }

    if (generatedSignature !== value.signature) {
      throw new BadRequestException('Signatures do not match')
    }

    return callbackRequest
  }
}
