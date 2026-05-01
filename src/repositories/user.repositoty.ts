// src/modules/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { PaginationDto } from 'src/dtos/pagination.dto';
import { QueryBuilderHelper } from 'src/utils/queryBuilder.utils';
import { UserFilterDto } from 'src/dtos/user.dto';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRepository(User) repo: Repository<User>,
  ) {
    super(dataSource, repo);
  }

  async findUserByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async findUserByEmailWithMemberships(email: string) {
    return this.repo.findOne({
      where: { email },
      relations: ['memberships', 'memberships.group'],
    });
  }

  async findUserByIdWithMemberships(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['memberships', 'memberships.group'],
    });
  }

  async findAllUsers(options: PaginationDto, userFilterDto: UserFilterDto) {
    const qb = this.repo.createQueryBuilder('user');

    const helper = new QueryBuilderHelper(qb);

    helper
      .applyRelations([{ alias: 'group', path: 'user.memberships' }])
      // .applySelect([
      //   'user.id',
      //   'user.firstName',
      //   'user.email',
      //   'user.created_at',
      //   'group.id',
      //   'group.userId',
      // ])
      .applySearch({
        'user.firstName': userFilterDto.searchQuery,
        'user.email': userFilterDto.searchQuery,
      })
      .applySorting('user.created_at', options.sortOrder);

    return helper.paginate(options, 'user');
  }
}
