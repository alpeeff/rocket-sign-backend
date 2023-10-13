import {
  DeliveryType,
  DeliveryTypeTranslation,
} from 'src/delivery-type/delivery-type.entity'
import {
  ReportType,
  ReportTypeTranslation,
} from 'src/report-type/report-type.entity'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class Seed1697194305744 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tank = await queryRunner.manager.save(DeliveryType, {
      price: 100,
    })

    const helicopter = await queryRunner.manager.save(DeliveryType, {
      price: 150,
    })

    const video = await queryRunner.manager.save(ReportType, {
      price: 100,
    })

    const photo = await queryRunner.manager.save(ReportType, {
      price: 0,
    })

    const tankTranslations = [
      queryRunner.manager.create(DeliveryTypeTranslation, {
        languageCode: 'uk',
        name: 'Танкова доставка',
        deliveryType: tank,
      }),

      queryRunner.manager.create(DeliveryTypeTranslation, {
        languageCode: 'en',
        name: 'Tank Delivery',
        deliveryType: tank,
      }),
    ]

    const helicopterTranslations = [
      queryRunner.manager.create(DeliveryTypeTranslation, {
        languageCode: 'uk',
        name: 'Гвинтокрильна доставка',
        deliveryType: helicopter,
      }),

      queryRunner.manager.create(DeliveryTypeTranslation, {
        languageCode: 'en',
        name: 'Helicopter Delivery',
        deliveryType: helicopter,
      }),
    ]

    const videoTranslations = [
      queryRunner.manager.create(ReportTypeTranslation, {
        languageCode: 'uk',
        name: 'Відео',
        description: 'Опис того, як відбувається передача відео',
        reportType: video,
      }),

      queryRunner.manager.create(ReportTypeTranslation, {
        languageCode: 'en',
        name: 'Video',
        description: 'Video description',
        reportType: video,
      }),
    ]

    const photoTranslations = [
      queryRunner.manager.create(ReportTypeTranslation, {
        languageCode: 'uk',
        name: 'Фото',
        description: 'Опис того, як відбувається передача фото',
        reportType: photo,
      }),

      queryRunner.manager.create(ReportTypeTranslation, {
        languageCode: 'en',
        name: 'Photo',
        description: 'Photo description',
        reportType: photo,
      }),
    ]

    await Promise.all([
      queryRunner.manager.save(tankTranslations),
      queryRunner.manager.save(helicopterTranslations),
      queryRunner.manager.save(videoTranslations),
      queryRunner.manager.save(photoTranslations),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //
  }
}
