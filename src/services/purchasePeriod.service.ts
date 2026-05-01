import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StandardResopnse } from 'src/common';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import { DeleteResult } from 'typeorm';

import {
  PurchasePeriodDto,
  PurchasePeriodFilterDto,
  UpdatePurchasePeriodDto,
} from 'src/dtos/purchasePeriod.dto';
import { PurchasePeriodRepository } from 'src/repositories/purchasePeriod.repository';
import { PurchasePeriod } from 'src/entities/purchasePeriod.entity';

import { PurchasePeriodItemFilterDto } from 'src/dtos/purchasePeriodItem.dto';
import { PurchasePeriodItem } from 'src/entities/purchasePeriodItem.entity';
import { PurchasePeriodItemRepository } from 'src/repositories/purchasePeriodItems.repository';
import { PurchasePeriodStatus } from 'src/common/index.enum';
import { RequestContext } from 'src/common/context/requestContext';

@Injectable()
export class PurchasePeriodService {
  constructor(
    private purchasePeriodRepository: PurchasePeriodRepository,
    private purchasePeriodItemRepository: PurchasePeriodItemRepository,
  ) {}

  async createPurchasePeriod(
    purchasePeriodDto: PurchasePeriodDto,
    publish: boolean = false,
  ): Promise<StandardResopnse<PurchasePeriodDto>> {
    const groupId = RequestContext.get('groupId');

    if (!groupId) {
      throw new UnauthorizedException('Invalid Request Context');
    }

    const existingPurchasePeriod = await this.purchasePeriodRepository.findOne({
      name: purchasePeriodDto.name,
      groupId,
    });

    if (existingPurchasePeriod) {
      throw new UnprocessableEntityException('Name Already Exists');
    }

    await this.purchasePeriodItemRepository.transaction(
      async (purchaseItemTxRepo) => {
        const { marketRunCommodities, ...rest } = purchasePeriodDto;

        const purchasePeriodTxRepo =
          purchaseItemTxRepo.manager.getRepository(PurchasePeriod);

        const marketRunCommodityTxRepo =
          purchaseItemTxRepo.manager.getRepository(PurchasePeriodItem);

        const purchasePeriodData = publish
          ? {
              ...rest,
              groupId,
              status: PurchasePeriodStatus.PUBLISHED,
            }
          : {
              ...rest,
              groupId,
              status: PurchasePeriodStatus.SAVED,
              requestStartDate: new Date(),
            };

        // 1. Create & save parent
        const purchasePeriod = purchasePeriodTxRepo.create(purchasePeriodData);

        const purchasePeriodCreated =
          await purchasePeriodTxRepo.save(purchasePeriod);

        // 2. Save child array (if present)
        if (
          Array.isArray(marketRunCommodities) &&
          marketRunCommodities.length > 0
        ) {
          const commodities = marketRunCommodities.map((item) =>
            marketRunCommodityTxRepo.create({
              ...item,
              groupId,
              purchasePeriodId: purchasePeriodCreated.id,
            }),
          );

          await marketRunCommodityTxRepo.save(commodities);
        }

        return purchasePeriodCreated;
      },
    );

    return {
      data: purchasePeriodDto,
      code: 200,
      message: 'Success',
    };
  }

  async publishPurchasePeriod(id: String): Promise<StandardResopnse<any>> {
    const existingPurchasePeriod =
      await this.purchasePeriodRepository.findById(id);

    if (!existingPurchasePeriod) {
      throw new NotFoundException('Market Run Not Found');
    }

    if (existingPurchasePeriod.status !== PurchasePeriodStatus.SAVED) {
      throw new UnprocessableEntityException(
        'Invalide Request: Market Run has been published',
      );
    }

    await this.purchasePeriodRepository.update(id, {
      status: PurchasePeriodStatus.PUBLISHED,
    });

    return {
      data: null,
      code: 200,
      message: 'Success',
    };
  }

  async updatePurchasePeriod(
    id: string,
    updatePurchasePeriodDto: UpdatePurchasePeriodDto,
    publish: boolean = false,
  ): Promise<StandardResopnse<UpdatePurchasePeriodDto>> {
    const existingPurchasePeriod =
      await this.purchasePeriodRepository.findById(id);

    if (!existingPurchasePeriod) {
      throw new NotFoundException('Market Run Not Found');
    }

    if (existingPurchasePeriod.status !== PurchasePeriodStatus.SAVED) {
      throw new UnprocessableEntityException(
        'Invalid Request: Only saved market runs can be edited',
      );
    }

    const groupId = RequestContext.get('groupId') ?? existingPurchasePeriod.groupId;

    if (updatePurchasePeriodDto.name) {
      const duplicatePurchasePeriod = await this.purchasePeriodRepository.findOne({
        name: updatePurchasePeriodDto.name,
        groupId,
      });

      if (duplicatePurchasePeriod && duplicatePurchasePeriod.id !== id) {
        throw new UnprocessableEntityException('Name Already Exists');
      }
    }

    const { marketRunCommodities: _marketRunCommodities, ...updatePayload } =
      updatePurchasePeriodDto;

    await this.purchasePeriodRepository.update(id, {
      ...updatePayload,
      ...(publish ? { status: PurchasePeriodStatus.PUBLISHED } : {}),
    });

    return {
      data: updatePurchasePeriodDto,
      code: 200,
      message: 'Success',
    };
  }

  async updateAndPublishPurchasePeriod(
    id: string,
    updatePurchasePeriodDto: UpdatePurchasePeriodDto,
  ): Promise<StandardResopnse<UpdatePurchasePeriodDto>> {
    return this.updatePurchasePeriod(id, updatePurchasePeriodDto, true);
  }

  async deletePurchasePeriod(
    id: string,
  ): Promise<StandardResopnse<DeleteResult>> {
    const existingPurchasePeriod =
      await this.purchasePeriodRepository.findById(id);

    if (!existingPurchasePeriod) {
      throw new NotFoundException('PurchasePeriod Not found');
    }

    await this.purchasePeriodRepository.delete(id);

    return {
      data: null,
      code: 200,
      message: 'Success',
    };
  }

  async findPurchasePeriodById(
    id: string,
  ): Promise<StandardResopnse<PurchasePeriod>> {
    const purchasePeriod =
      await this.purchasePeriodRepository.findPurchasePeriodById(id);

    if (!purchasePeriod) {
      throw new NotFoundException('Market Run Not Found');
    }

    return {
      data: purchasePeriod,
      code: 200,
      message: 'Success',
    };
  }

  async findpurchasePeriods(
    paginationDto: PaginationDto,
    PurchasePeriodFilterDto: PurchasePeriodFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<PurchasePeriod>>> {
    const result = (await this.purchasePeriodRepository.findAllpurchasePeriods(
      paginationDto,
      PurchasePeriodFilterDto,
    )) as PaginatedRecordsDto<PurchasePeriod>;

    return {
      data: result,
      code: 200,
      message: 'Success',
    };
  }

  async findPurchasePeriodItems(
    paginationDto: PaginationDto,
    PurchasePeriodUnitFilterDto: PurchasePeriodItemFilterDto,
    PurchasePeriodId: string,
  ): Promise<StandardResopnse<PaginatedRecordsDto<PurchasePeriodItem>>> {
    const result =
      (await this.purchasePeriodItemRepository.findAllpurchasePeriodItems(
        paginationDto,
        PurchasePeriodUnitFilterDto,
        PurchasePeriodId,
      )) as PaginatedRecordsDto<PurchasePeriodItem>;

    return {
      data: result,
      code: 200,
      message: 'Success',
    };
  }
}
