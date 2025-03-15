// import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany } from 'typeorm';
// import { Wishlists } from '../WishLists/Wishlists';

// @Entity({ name: "SellingStartup" })
// export class SellingStartup extends BaseEntity {

//     @PrimaryGeneratedColumn('uuid')
//     id!: string;

//     @Column({ type: 'uuid' })
//     userId !: string;

//     @Column({ type: "bool", default: false })
//     isHidden !: boolean;

//     @Column({ type: 'varchar', nullable: true })
//     officialName!: string;

//     @Column({ type: 'varchar', nullable: true })
//     country!: string;

//     @Column({ type: 'varchar', nullable: true })
//     city!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessType!: string;

//     @Column({ type: 'varchar', nullable: true })
//     operationDuration!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessDescription!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessLogo!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessModel!: string;

//     @Column({ type: 'varchar', nullable: true })
//     sellingReason!: string;

//     @Column({ type: 'varchar', nullable: true })
//     customerBase!: string;

//     @Column({ type: 'varchar', nullable: true })
//     askingPrice!: string;

//     @Column({ type: 'varchar', nullable: true })
//     annualRevenue!: string;

//     @Column({ type: 'varchar', nullable: true })
//     annualProfit!: string;

//     @Column({ type: 'varchar', nullable: true })
//     assetValue!: string;

//     @Column({ type: 'varchar', nullable: true })
//     outstandingDebts!: string;

//     @Column({ type: 'varchar', nullable: true })
//     isProfitable!: string;

//     @Column({ type: 'varchar', nullable: true })
//     keyProductsServices!: string;

//     @Column({ type: 'varchar', nullable: true })
//     numberOfEmployees!: string;

//     @Column({ type: 'varchar', nullable: true })
//     legalStructure!: string;

//     @Column({ type: 'varchar', nullable: true })
//     locationStatus!: string;

//     @Column({ type: 'varchar', nullable: true })
//     leaseTerm!: string;

//     @Column({ type: 'varchar', nullable: true })
//     intellectualProperty!: string;

//     @Column({ type: 'varchar', nullable: true })
//     existingContracts!: string;

//     @Column({ type: 'varchar', nullable: true })
//     legalIssues!: string;

//     @Column({ type: 'varchar', nullable: true })
//     ownershipStructure!: string;

//     @Column({ type: 'varchar', nullable: true })
//     keyOperations!: string;

//     @Column({ type: 'varchar', nullable: true })
//     supportAfterSale!: string;

//     @Column({ type: 'varchar', nullable: true })
//     valuationDone!: string;

//     @Column({ type: 'varchar', nullable: true })
//     sellingTimeline!: string;

//     @Column({ type: 'varchar', nullable: true })
//     financingOptions!: string;

//     @Column({ type: 'varchar', nullable: true })
//     keySellingPoints!: string;

//     @Column({ type: 'varchar', nullable: true })
//     additionalInfo!: string;

//     @OneToMany(() => Wishlists, (wishlist) => wishlist.sellingStartup) 
//     wishlists!: Wishlists[];
// }

import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    BaseEntity, 
    OneToMany 
} from 'typeorm';
import { Wishlists } from '../WishLists/Wishlists';
import { 
    IsBoolean, 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    IsUUID, 
    IsNumberString 
} from 'class-validator';

@Entity({ name: "SellingStartup" })
export class SellingStartup extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    userId!: string;

    @Column({ type: "bool", default: false })
    @IsBoolean()
    isHidden!: boolean;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    officialName!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    country!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    city!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    businessType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    operationDuration!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    businessDescription!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    businessLogo!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    businessModel!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    sellingReason!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    customerBase!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsNumberString()
    @IsOptional()
    askingPrice!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsNumberString()
    @IsOptional()
    annualRevenue!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsNumberString()
    @IsOptional()
    annualProfit!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsNumberString()
    @IsOptional()
    assetValue!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsNumberString()
    @IsOptional()
    outstandingDebts!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    isProfitable!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    keyProductsServices!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsNumberString()
    @IsOptional()
    numberOfEmployees!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    legalStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    locationStatus!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    leaseTerm!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    intellectualProperty!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    existingContracts!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    legalIssues!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    ownershipStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    keyOperations!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    supportAfterSale!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    valuationDone!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    sellingTimeline!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    financingOptions!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    keySellingPoints!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsString()
    @IsOptional()
    additionalInfo!: string;

    @OneToMany(() => Wishlists, (wishlist) => wishlist.sellingStartup) 
    wishlists!: Wishlists[];
}
