/* eslint-disable prettier/prettier */
import { randomBytes } from 'crypto';
import { BaseEntity, BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "BusinessForSale" })
export class BusinessForSale extends BaseEntity {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessType!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  yearsInOperation!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  primaryBusinessModel!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reasonForSale!: string;

  @Column({ type: 'decimal', nullable: true })
  askingPrice!: number;

  @Column({ type: 'decimal', nullable: true })
  annualRevenue!: number;

  @Column({ type: 'decimal', nullable: true })
  annualProfit!: number;

  @Column({ type: 'decimal', nullable: true })
  assetValue!: number;

  @Column({ type: 'boolean', nullable: true })
  hasOutstandingDebts!: boolean;

  @Column({ type: 'boolean', nullable: true })
  isProfitable!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keyProductsOrServices!: string;

  @Column({ type: 'int', nullable: true })
  numberOfEmployees!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessStructure!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessOwnershipStatus!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leaseTerm!: string;

  @Column({ type: 'boolean', nullable: true })
  hasIntellectualProperty!: boolean;

  @Column({ type: 'boolean', nullable: true })
  hasContracts!: boolean;

  @Column({ type: 'boolean', nullable: true })
  hasLegalIssues!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ownershipStructure!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keyOperations!: string;

  @Column({ type: 'boolean', nullable: true })
  offersSupportAfterSale!: boolean;

  @Column({ type: 'boolean', nullable: true })
  hadBusinessValuation!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  desiredTimelineForSale!: string;

  @Column({ type: 'boolean', nullable: true })
  openToSellerFinancing!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sellingPoints!: string;
  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
