/* eslint-disable prettier/prettier */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "BusinessForSale" })
export class BusinessForSale {

  @PrimaryGeneratedColumn("uuid")
  Id!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  BusinessType!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  YearsInOperation!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  PrimaryBusinessModel!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  ReasonForSale!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  AskingPrice!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  AnnualRevenue!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  AnnualProfit!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  AssetValue!: string; 

  @Column({ type: 'boolean', nullable: true })
  HasOutstandingDebts!: boolean; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  FinancialRisks!: string; 

  @Column({ type: 'boolean', nullable: true })
  IsProfitable!: boolean; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  KeyProductsOrServices!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  NumberOfEmployees!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  BusinessStructure!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  BusinessOwnershipStatus!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  LeaseTerm!: string; 

  @Column({ type: 'boolean', nullable: true })
  HasIntellectualProperty!: boolean; 

  @Column({ type: 'boolean', nullable: true })
  HasContracts!: boolean; 

  @Column({ type: 'boolean', nullable: true })
  HasLegalIssues!: boolean; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  OwnershipStructure!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  KeyOperations!: string; 

  @Column({ type: 'boolean', nullable: true })
  OffersSupportAfterSale!: boolean; 

  @Column({ type: 'boolean', nullable: true })
  EmployeesAfterSale!: boolean; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  TypeOfBuyerLookingFor!: string; 

  @Column({ type: 'boolean', nullable: true })
  HadBusinessValuation!: boolean; 

  @Column({ type: 'boolean', nullable: true })
  OpenToNegotiation!: boolean; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  DesiredTimelineForSale!: string; 

  @Column({ type: 'boolean', nullable: true })
  OpenToSellerFinancing!: boolean; 

  @Column({ type: 'boolean', nullable: true })
  WillingToStayInvolved!: boolean; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  SellingPoints!: string; 

  @Column({ type: 'varchar', length: 200, nullable: true })
  AdditionalInformation!: string; 
}
