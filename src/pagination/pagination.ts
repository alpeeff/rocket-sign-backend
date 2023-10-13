import { IsInt } from 'class-validator'
import { TranslatableRequestDTO } from 'src/translations/dtos'

export class PaginationOptionsDTO {
  @IsInt()
  limit: number

  @IsInt()
  page: number
}

export class TranslatablePaginationOptionsDTO extends TranslatableRequestDTO {
  @IsInt()
  limit: number

  @IsInt()
  page: number
}

export interface IPaginationResult<PaginatedEntity> {
  results: PaginatedEntity[]
  total: number
  next?: string
  previous?: string
}

export class Pagination<PaginatedEntity> {
  public results: PaginatedEntity[]
  public page_total: number
  public total: number

  constructor(paginationResults: IPaginationResult<PaginatedEntity>) {
    this.results = paginationResults.results
    this.page_total = paginationResults.results.length
    this.total = paginationResults.total
  }
}
