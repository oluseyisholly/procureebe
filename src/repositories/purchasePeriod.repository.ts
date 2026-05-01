// src/modules/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { PurchasePeriod } from 'src/entities/purchasePeriod.entity';
import { QueryBuilderHelper } from 'src/utils/queryBuilder.utils';
import { PaginationDto } from 'src/dtos/pagination.dto';
import { PurchasePeriodFilterDto } from 'src/dtos/purchasePeriod.dto';

@Injectable()
export class PurchasePeriodRepository extends BaseRepository<PurchasePeriod> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRepository(PurchasePeriod) repo: Repository<PurchasePeriod>,
  ) {
    super(dataSource, repo);
  }

  async findAllpurchasePeriods(
    options: PaginationDto,
    PurchasePeriodFilterDto: PurchasePeriodFilterDto,
  ) {
    const qb = this.repo.createQueryBuilder('purchasePeriod');

    const helper = new QueryBuilderHelper(qb);

    helper

      .applySearch({
        'purchasePeriod.name': PurchasePeriodFilterDto.searchQuery,
      })
      .applySorting('purchasePeriod.created_at', options.sortOrder);

    return helper.paginate(options, 'purchasePeriod');
  }

  async findPurchasePeriodById(id: string) {
    const qb = this.repo.createQueryBuilder('purchasePeriod');
    const helper = new QueryBuilderHelper(qb);

    qb.leftJoinAndSelect(
      'purchasePeriod.marketRunCommodities',
      'marketRunCommodities',
    )
      .leftJoinAndSelect('marketRunCommodities.commodity', 'commodity')
      .leftJoinAndSelect('marketRunCommodities.commodityUnit', 'commodityUnit')
      .select([
        'purchasePeriod.id',
        'purchasePeriod.groupId',
        'purchasePeriod.name',
        'purchasePeriod.requestStartDate',
        'purchasePeriod.requestEndDate',
        'purchasePeriod.status',
        'purchasePeriod.marketRunDate',
        'purchasePeriod.allocationsLocked',
        'purchasePeriod.created_at',
        'purchasePeriod.updated_at',
        'marketRunCommodities.id',
        'marketRunCommodities.commodityId',
        'marketRunCommodities.commodityUnitId',
        'marketRunCommodities.pricePerUnit',
        'marketRunCommodities.status',
        'marketRunCommodities.displayLabel',
        'marketRunCommodities.isVisibleToProcurees',
        'marketRunCommodities.minQty',
        'marketRunCommodities.maxQty',
        'commodity.id',
        'commodity.name',
        'commodityUnit.id',
        'commodityUnit.name',
        'commodityUnit.type',
      ]);

    qb.where('purchasePeriod.id = :id', { id });
    qb.orderBy('marketRunCommodities.created_at', 'ASC');

    return helper.findOne('purchasePeriod');
  }
}
