// user.entity.ts – ROOT (no groupId)
import { Entity, Column, Unique, OneToMany } from 'typeorm';
import { Base } from './base';
import { UserGroup } from './user_group.entity';

@Entity('users')
@Unique('uq_user_email', ['email'])
@Unique('uq_user_phone', ['phone'])
export class User extends Base {
  @Column({ type: 'varchar', length: 100 }) firstName!: string;
  @Column({ type: 'varchar', length: 100 }) lastName!: string;

  @Column({ type: 'citext' }) email!: string; // citext extension
  @Column({ type: 'varchar', length: 20, nullable: true }) phone?: string; // E.164

  @Column({ type: 'boolean', default: false }) emailVerified!: boolean;
  @Column({ type: 'boolean', default: false }) phoneVerified!: boolean;
  @Column({ type: 'char', length: 60, nullable: true }) passwordHash?: string;

  // UX helper
  @Column({ type: 'uuid', nullable: true }) currentGroupId?: string | null;

  @OneToMany(() => UserGroup, (ug) => ug.user, { cascade: false })
  memberships!: UserGroup[];
}
