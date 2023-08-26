import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from '@nestjs/common'
import { User } from 'src/users/user.entity'
import { GetFileDTO } from './dtos'
import { FilesService } from './files.service'
import { validate } from 'class-validator'
import { Action, CaslAbilityFactory } from 'src/casl/casl-ability.factory'

export class FilesGuard implements CanActivate {
  constructor(
    @Inject(FilesService) private filesService: FilesService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const { user, params }: { user: User; params: GetFileDTO } = request

    const getFileParams = new GetFileDTO()
    getFileParams.fileId = params.fileId

    const errors = await validate(getFileParams, {
      validationError: { target: false, value: false },
    })

    if (errors.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints)).flat(),
      )
    }

    const fileExists = await this.filesService.fileExists(getFileParams)

    if (!fileExists) {
      throw new NotFoundException(`File doesn't exist`)
    }

    const ability = this.caslAbilityFactory.createForUser(user)

    if (!ability.can(Action.Read, fileExists)) {
      throw new NotFoundException(`File doesn't exist`)
    }

    request.file = fileExists

    return true
  }
}
