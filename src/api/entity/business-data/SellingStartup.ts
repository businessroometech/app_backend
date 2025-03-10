import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: "SellingStartup" })
export class SellingStartup extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId !: string;

    @Column({ type: "bool", default: false })
    isHidden !: boolean;

    @Column({ type: 'varchar', nullable: true })
    officialName!: string;

    @Column({ type: 'varchar', nullable: true })
    country!: string;

    @Column({ type: 'varchar', nullable: true })
    city!: string;

    @Column({ type: 'varchar', nullable: true })
    businessType!: string;

    @Column({ type: 'varchar', nullable: true })
    operationDuration!: string;

    @Column({ type: 'varchar', nullable: true })
    businessDescription!: string;

    @Column({ type: 'varchar', nullable: true })
    businessLogo!: string;

    @Column({ type: 'varchar', nullable: true })
    businessModel!: string;

    @Column({ type: 'varchar', nullable: true })
    sellingReason!: string;

    @Column({ type: 'varchar', nullable: true })
    customerBase!: string;

    @Column({ type: 'varchar', nullable: true })
    askingPrice!: string;

    @Column({ type: 'varchar', nullable: true })
    annualRevenue!: string;

    @Column({ type: 'varchar', nullable: true })
    annualProfit!: string;

    @Column({ type: 'varchar', nullable: true })
    assetValue!: string;

    @Column({ type: 'varchar', nullable: true })
    outstandingDebts!: string;

    @Column({ type: 'varchar', nullable: true })
    isProfitable!: string;

    @Column({ type: 'varchar', nullable: true })
    keyProductsServices!: string;

    @Column({ type: 'varchar', nullable: true })
    numberOfEmployees!: string;

    @Column({ type: 'varchar', nullable: true })
    legalStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    locationStatus!: string;

    @Column({ type: 'varchar', nullable: true })
    leaseTerm!: string;

    @Column({ type: 'varchar', nullable: true })
    intellectualProperty!: string;

    @Column({ type: 'varchar', nullable: true })
    existingContracts!: string;

    @Column({ type: 'varchar', nullable: true })
    legalIssues!: string;

    @Column({ type: 'varchar', nullable: true })
    ownershipStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    keyOperations!: string;

    @Column({ type: 'varchar', nullable: true })
    supportAfterSale!: string;

    @Column({ type: 'varchar', nullable: true })
    valuationDone!: string;

    @Column({ type: 'varchar', nullable: true })
    sellingTimeline!: string;

    @Column({ type: 'varchar', nullable: true })
    financingOptions!: string;

    @Column({ type: 'varchar', nullable: true })
    keySellingPoints!: string;

    @Column({ type: 'varchar', nullable: true })
    additionalInfo!: string;
}