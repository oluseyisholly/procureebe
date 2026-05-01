import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StandardResopnse } from 'src/common';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import { DeleteResult } from 'typeorm';

import {
  PurchasePeriodItemDto,
  PurchasePeriodItemFilterDto,
  UpdatePurchasePeriodItemDto,
} from 'src/dtos/purchasePeriodItem.dto';
import { PurchasePeriodItem } from 'src/entities/purchasePeriodItem.entity';

import { PurchasePeriodItemRepository } from 'src/repositories/purchasePeriodItems.repository';
import { PurchasePeriodStatus } from 'src/common/index.enum';

@Injectable()
export class PurchasePeriodItemService {
  constructor(
    private PurchasePeriodItemRepository: PurchasePeriodItemRepository,
  ) {}

  async createPurchasePeriodItem(
    purchasePeriodItemDto: PurchasePeriodItemDto,
  ): Promise<StandardResopnse<PurchasePeriodItemDto>> {
    let _purchasePeriodItemDto = purchasePeriodItemDto;

    await this.PurchasePeriodItemRepository.create(purchasePeriodItemDto);

    return {
      data: _purchasePeriodItemDto,
      code: 200,
      message: 'Success',
    };
  }

  async updatePurchasePeriodItem(
    id: string,
    updatePurchasePeriodItemDto: UpdatePurchasePeriodItemDto,
  ): Promise<StandardResopnse<UpdatePurchasePeriodItemDto>> {
    const existingPurchasePeriodItem =
      await this.PurchasePeriodItemRepository.findPurchasePeriodItemById(id);

    if (!existingPurchasePeriodItem) {
      throw new NotFoundException('PurchasePeriodItem Not found');
    }

    if (
      existingPurchasePeriodItem.purchasePeriod?.status !==
      PurchasePeriodStatus.SAVED
    ) {
      throw new UnprocessableEntityException(
        'Invalid Request: Only items in saved market runs can be edited',
      );
    }

    await this.PurchasePeriodItemRepository.update(
      id,
      updatePurchasePeriodItemDto,
    );

    return {
      data: updatePurchasePeriodItemDto,
      code: 200,
      message: 'Success',
    };
  }

  async deletePurchasePeriodItem(
    id: string,
  ): Promise<StandardResopnse<DeleteResult>> {
    const existingPurchasePeriodItem =
      await this.PurchasePeriodItemRepository.findPurchasePeriodItemById(id);

    if (!existingPurchasePeriodItem) {
      throw new NotFoundException('PurchasePeriodItem Not found');
    }

    if (
      existingPurchasePeriodItem.purchasePeriod?.status !==
      PurchasePeriodStatus.SAVED
    ) {
      throw new UnprocessableEntityException(
        'Invalid Request: Only items in saved market runs can be edited',
      );
    }

    await this.PurchasePeriodItemRepository.delete(id);

    return {
      data: null,
      code: 200,
      message: 'Success',
    };
  }

  async findpurchasePeriodItems(
    paginationDto: PaginationDto,
    PurchasePeriodItemFilterDto: PurchasePeriodItemFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<PurchasePeriodItem>>> {
    const result =
      (await this.PurchasePeriodItemRepository.findAllpurchasePeriodItems(
        paginationDto,
        PurchasePeriodItemFilterDto,
      )) as PaginatedRecordsDto<PurchasePeriodItem>;

    return {
      data: result,
      code: 200,
      message: 'Success',
    };
  }
}
