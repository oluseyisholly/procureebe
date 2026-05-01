// src/modules/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { UserGroup } from 'src/entities/user_group.entity';
import { RoleEnum } from 'src/common/index.enum';
import { PaginationDto } from 'src/dtos/pagination.dto';
import { UserFilterDto } from 'src/dtos/user.dto';
import { QueryBuilderHelper } from 'src/utils/queryBuilder.utils';

@Injectable()
export class UserGroupRepository extends BaseRepository<UserGroup> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRepository(UserGroup) repo: Repository<UserGroup>,
  ) {
    super(dataSource, repo);
  }

  async findAllUsers(options: PaginationDto, userFilterDto: UserFilterDto) {
    const qb = this.repo.createQueryBuilder('user_groups');

    const helper = new QueryBuilderHelper(qb);

    helper
      .applyRelations([
        { alias: 'user', path: 'user_groups.user' },
        { alias: 'group', path: 'user_groups.group' },
      ])
      .applyFilter({
        'user_groups.role': [RoleEnum.PATRON, RoleEnum.PROCUREE],
      })
      .applySelect([
        'user_groups.id',
        'user_groups.role',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phone',
        'user.created_at',
        'group.id',
        'group.name',
      ])
      .applySearch({
        'user.firstName': userFilterDto.searchQuery,
        'user.email': userFilterDto.searchQuery,
      })
      .applySorting('user.created_at', options.sortOrder);

    return helper.paginate(options, 'user_groups');
  }

  async findUserGroupByUserIdAndGroupId(userId: string, groupId: string) {
    return this.repo.findOne({
      where: { userId, groupId },
      relations: ['user', 'group'],
    });
  }

  async findFirstUserGroupByUserId(userId: string) {
    return this.repo.findOne({
      where: { userId },
      relations: ['user', 'group'],
      order: { created_at: 'ASC' },
    });
  }

  async findMembershipsByUserId(userId: string) {
    return this.repo.find({
      where: { userId },
      relations: ['user', 'group'],
      order: { created_at: 'ASC' },
    });
  }

  async findMembershipByIdForUser(userId: string, membershipId: string) {
    return this.repo.findOne({
      where: { id: membershipId, userId },
      relations: ['user', 'group'],
    });
  }

  async findMembershipByGroupIdForUser(userId: string, groupId: string) {
    return this.repo.findOne({
      where: { userId, groupId },
      relations: ['user', 'group'],
    });
  }

  async findMembershipByInviteCodeForUser(userId: string, inviteCode: string) {
    return this.repo
      .createQueryBuilder('user_groups')
      .leftJoinAndSelect('user_groups.user', 'user')
      .leftJoinAndSelect('user_groups.group', 'group')
      .where('user_groups.userId = :userId', { userId })
      .andWhere('group.inviteCode = :inviteCode', { inviteCode })
      .getOne();
  }

  async userHasAdminMembership(userId: string) {
    return this.repo.exist({
      where: { userId, role: RoleEnum.ADMIN },
    });
  }

  async userHasAnyMembership(userId: string) {
    return this.repo.exist({
      where: { userId },
    });
  }
}
