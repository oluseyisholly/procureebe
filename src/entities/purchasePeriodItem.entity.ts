import { Entity, Column, Index, ManyToOne, Unique } from 'typeorm';
import { Base } from './base';
import { PurchasePeriod } from './purchasePeriod.entity';
import { Commodity } from './commodity.entity';
import { CommodityUnit } from './commodityUnit.entity';
import { PurchasePeriodItemStatus } from 'src/common/index.enum';

@Entity('purchase_period_items')
@Unique('uq_period_commodity_unit', [
  'groupId',
  'purchasePeriodId',
  'commodityId',
  'commodityUnitId',
])
export class PurchasePeriodItem extends Base {
  @Column('uuid')
  @Index()
  groupId!: string;

  // 🔹 which purchase period (market run) this item belongs to
  @Column('uuid')
  @Index()
  purchasePeriodId!: string;

  @ManyToOne(
    () => PurchasePeriod,
    (purchasePeriod) => purchasePeriod.marketRunCommodities,
    { onDelete: 'CASCADE' },
  )
  purchasePeriod!: PurchasePeriod;

  // 🔹 which commodity (e.g. Onions, Tomatoes)
  @Column('uuid')
  @Index()
  commodityId!: string;

  @ManyToOne(() => Commodity, { onDelete: 'CASCADE' })
  commodity!: Commodity;

  // 🔹 which unit of that commodity (e.g. kg, bag)
  @Column('uuid')
  @Index()
  commodityUnitId!: string;

  @ManyToOne(() => CommodityUnit, { onDelete: 'CASCADE' })
  commodityUnit!: CommodityUnit;

  // 🔹 current price per unit for THIS period
  // (no versioning yet; you can extend later with a PriceVersion table)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  pricePerUnit!: number;

  // 🔹 optional: easy enabling/disabling of items in a run
  @Column({
    type: 'enum',
    enum: PurchasePeriodItemStatus,
    default: PurchasePeriodItemStatus.ACTIVE,
  })
  status!: PurchasePeriodItemStatus;

  // 🔹 optional: Admin notes/labels for this item in this period
  @Column({ type: 'varchar', length: 255, nullable: true })
  displayLabel?: string; // e.g. "Small basket", "Local onions"

  @Column({ type: 'boolean', default: true })
  isVisibleToProcurees!: boolean; // quick toggle for the UI

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minQty?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxQty?: number;
}
