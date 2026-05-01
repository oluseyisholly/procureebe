import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { Base } from './base';
import { Group } from './group.entity';
import { PurchasePeriodStatus } from 'src/common/index.enum';
import { PurchasePeriodItem } from './purchasePeriodItem.entity';

@Entity('purchase_periods')
@Index(['groupId', 'status'])
export class PurchasePeriod extends Base {
  @Column('uuid')
  @Index()
  groupId!: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group!: Group;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
  // Example: "Saturday Run - Nov 22, 2025"
  // Or "Week 14 Market Run"

  @Column({ type: 'timestamptz', nullable: true })
  requestStartDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  requestEndDate!: Date;

  @Column({
    type: 'enum',
    enum: PurchasePeriodStatus,
    default: PurchasePeriodStatus.SAVED,
  })
  status!: PurchasePeriodStatus;

  @Column({ type: 'timestamptz', nullable: true })
  marketRunDate?: Date | null;

  @Column({ type: 'boolean', default: false })
  allocationsLocked!: boolean;
  // After Admin allocates items, prevent changes

  @OneToMany(
    () => PurchasePeriodItem,
    (purchasePeriodItem) => purchasePeriodItem.purchasePeriod,
  )
  marketRunCommodities!: PurchasePeriodItem[];
}
