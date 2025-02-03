/* eslint-disable prettier/prettier */
import { randomBytes } from 'crypto';
import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: "BusinessForSale" })
export class BusinessForSale extends BaseEntity {

  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: 'varchar', length: 100})
  UserId!: string;

    
  @Column("json")
  OwnerDetails!: any[];
       
  @Column({ type: "text" , nullable: true })
  OwnerImage! : string

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessLocation!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operatingYears!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessDescription!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessModel!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reasonForSelling!: string;

  @Column({ type: 'int', nullable: true })
  customerBaseType!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hasContracts!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hasLegalIssues!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  askingPrice!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  annualRevenue!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  annualProfit!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assetValue!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hasDebts!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  isProfitable!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  productsServices!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  numberOfEmployees!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessStructure!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  propertyStatus!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leaseTerm!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hasIntellectualProperty!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ownershipStructure!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  operationSystems!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  offerTraining!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hasValuation!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  desiredTimeline!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sellerFinancing!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keySellingPoints!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  additionalInformation!: string;



  @Column({ type: 'text', nullable: true })
  businessLogo!: string;

 

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
