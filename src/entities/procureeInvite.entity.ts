import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';
import { Base } from './base';
import { Group } from './group.entity';

@Entity('procuree_invites')
@Unique('uq_procuree_invites_token_hash', ['tokenHash'])
export class ProcureeInvite extends Base {
  @Column('uuid')
  @Index()
  groupId!: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group!: Group;

  @Column({ type: 'varchar', length: 128 })
  tokenHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index('idx_procuree_invites_email')
  email?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_procuree_invites_phone')
  phone?: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date | null;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @Column({ type: 'uuid', nullable: true })
  acceptedByUserId?: string | null;
}
