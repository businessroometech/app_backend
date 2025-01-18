/* eslint-disable prettier/prettier */
import { randomBytes } from 'crypto';
import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: "BusinessForSale" })
export class BusinessForSale extends BaseEntity {

  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: 'varchar', length: 100})
  UserId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessType!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessStage!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  revenue!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  profit!: string;

  @Column({ type: 'int', nullable: true })
  numberOfEmployees!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ownershipPercentage!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reasonForSelling!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  askingPrice!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  intellectualProperty!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  assetsForSale!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  liabilities!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  financialHistory!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  salesForecast!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  marketingStrategy!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  competition!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  exitStrategy!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legalIssues!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  expectedTimeline!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  additionalInformation!: string;


  @Column({ type: 'varchar', length: 500, nullable: true })
  businessLogo!: string;

 

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
