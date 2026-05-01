import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { ProcureeInvite } from 'src/entities/procureeInvite.entity';

@Injectable()
export class ProcureeInviteRepository extends BaseRepository<ProcureeInvite> {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRepository(ProcureeInvite) repo: Repository<ProcureeInvite>,
  ) {
    super(dataSource, repo);
  }

  async findByTokenHashWithGroup(tokenHash: string) {
    return this.repo.findOne({
      where: { tokenHash },
      relations: ['group'],
    });
  }

  async findLatestByRecipientWithGroup(
    groupId: string,
    recipient: {
      email?: string;
      phone?: string;
    },
  ) {
    const qb = this.repo
      .createQueryBuilder('procuree_invite')
      .leftJoinAndSelect('procuree_invite.group', 'group')
      .where('procuree_invite.groupId = :groupId', { groupId })
      .orderBy('procuree_invite.created_at', 'DESC')
      .take(1);

    if (recipient.email && recipient.phone) {
      qb.andWhere(
        '(procuree_invite.email = :email OR procuree_invite.phone = :phone)',
        {
          email: recipient.email,
          phone: recipient.phone,
        },
      );
    } else if (recipient.email) {
      qb.andWhere('procuree_invite.email = :email', { email: recipient.email });
    } else if (recipient.phone) {
      qb.andWhere('procuree_invite.phone = :phone', { phone: recipient.phone });
    } else {
      return null;
    }

    return qb.getOne();
  }
}
