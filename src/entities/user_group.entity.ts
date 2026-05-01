// user_group.entity.ts – TENANT-SCOPED (has groupId + role)
import { Entity, Column, ManyToOne, Unique, Index } from 'typeorm';
import { Base } from './base';
import { Group } from './group.entity';
import { User } from './user.entity';
import { RoleEnum } from 'src/common/index.enum';



@Entity('user_groups')
@Unique('uq_user_group', ['userId', 'groupId'])
export class UserGroup extends Base {
  @Column('uuid') @Index() userId!: string;
  @ManyToOne(() => User, (u) => u.memberships, { onDelete: 'CASCADE' })
  user!: User;

  @Column('uuid') @Index() groupId!: string;
  @ManyToOne(() => Group, (g) => g.memberships, { onDelete: 'CASCADE' })
  group!: Group;

  @Column({ type: 'enum', enum: RoleEnum })
  role!: RoleEnum;
}
