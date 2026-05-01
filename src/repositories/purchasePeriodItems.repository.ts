// src/modules/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { PurchasePeriodItem } from 'src/entities/purchasePeriodItem.entity';
import { QueryBuilderHelper } from 'src/utils/queryBuilder.utils';
import { PaginationDto } from 'src/dtos/pagination.dto';
import { PurchasePeriodItemFilterDto } from 'src/dtos/purchasePeriodItem.dto';

@Injectable()
export class PurchasePeriodItemRepository extends BaseRepository<PurchasePeriodItem> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRepository(PurchasePeriodItem) repo: Repository<PurchasePeriodItem>,
  ) {
    super(dataSource, repo);
  }

  async findAllpurchasePeriodItems(
    options: PaginationDto,
    PurchasePeriodItemFilterDto: PurchasePeriodItemFilterDto,
    purchasePeriodId?: string,
  ) {
    const qb = this.repo.createQueryBuilder('purchasePeriodItem');

    const helper = new QueryBuilderHelper(qb);

    helper
      // .applySearch({
      //   'purchasePeriodItem.name': PurchasePeriodItemFilterDto.searchQuery,
      // })
      .applySorting('purchasePeriodItem.created_at', options.sortOrder);

    if (purchasePeriodId) {
      helper.applyFilter({ 'purchasePeriodItem.purchasePeriodId': purchasePeriodId });
    }

    return helper.paginate(options, 'purchasePeriodItem');
  }

  async findPurchasePeriodItemById(id: string) {
    const qb = this.repo.createQueryBuilder('purchasePeriodItem');
    const helper = new QueryBuilderHelper(qb);

    helper.applyRelations([
      {
        alias: 'purchasePeriod',
        path: 'purchasePeriodItem.purchasePeriod',
      },
    ]);

    qb.where('purchasePeriodItem.id = :id', { id });

    return helper.findOne('purchasePeriodItem');
  }
}
