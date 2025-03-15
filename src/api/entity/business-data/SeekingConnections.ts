// import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

// @Entity({ name: "SeekingConnections" })
// export class SeekingConnections extends BaseEntity {

//     @PrimaryGeneratedColumn('uuid')
//     id!: string;

//     @Column({ type: 'uuid' }) 
//     userId !: string;

//     @Column({ type: "bool", default: false })
//     isHidden !: boolean;

//     @Column({ type: 'varchar', nullable: true })
//     businessName!: string;

//     @Column({ type: 'varchar', nullable: true })
//     country!: string;

//     @Column({ type: 'varchar', nullable: true })
//     city!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessIdea!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessStage!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessIndustry!: string;

//     @Column({ type: 'varchar', nullable: true })
//     otherBusinessIndustry!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessDuration!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessProblem!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessTraction!: string;

//     @Column({ type: 'varchar', nullable: true })
//     investorType!: string;

//     @Column({ type: 'varchar', nullable: true })
//     otherInvestorType!: string;

//     @Column({ type: 'varchar', nullable: true })
//     fundingAmount!: string;

//     @Column({ type: 'varchar', nullable: true })
//     fundUsage!: string;

//     @Column({ type: 'varchar', nullable: true })
//     otherFundUsage!: string;

//     @Column({ type: 'varchar', nullable: true })
//     investmentType!: string;

//     @Column({ type: 'varchar', nullable: true })
//     otherInvestmentType!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessValuation!: string;

//     @Column({ type: 'varchar', nullable: true })
//     equityOffer!: string;

//     @Column({ type: 'varchar', nullable: true })
//     exitStrategy!: string;

//     @Column({ type: 'varchar', nullable: true })
//     partnerType!: string;

//     @Column({ type: 'varchar', nullable: true })
//     partnerSkills!: string;

//     @Column({ type: 'varchar', nullable: true })
//     partnerInvolvement!: string;

//     @Column({ type: 'varchar', nullable: true })
//     otherPartnerInvolvement!: string;

//     @Column({ type: 'varchar', nullable: true })
//     equityCompensation!: string;

//     @Column({ type: 'varchar', nullable: true })
//     partnershipStructure!: string;

//     @Column({ type: 'varchar', nullable: true })
//     otherPartnershipStructure!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessChallenges!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessPriorities!: string;

//     @Column({ type: 'varchar', nullable: true })
//     supportNeeded!: string;

//     @Column({ type: 'varchar', nullable: true })
//     businessPlan!: string;

//     @Column({ type: 'varchar', nullable: true })
//     keyMilestones!: string;

//     @Column({ type: 'varchar', nullable: true })
//     longTermGoals!: string;

//     @Column({ type: 'varchar', nullable: true })
//     additionalInfo!: string;
// }

import { 
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, BeforeInsert, BeforeUpdate 
} from 'typeorm';
import { 
    IsUUID, IsBoolean, IsOptional, IsString, IsNumber, Min, Max, validateOrReject 
} from 'class-validator';

@Entity({ name: "SeekingConnections" })
export class SeekingConnections extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' }) 
    @IsUUID()
    userId!: string;

    @Column({ type: "bool", default: false })
    @IsBoolean()
    isHidden!: boolean;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessName!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    country!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    city!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessIdea!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessStage!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessIndustry!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    otherBusinessIndustry!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessDuration!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessProblem!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessTraction!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investorType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    otherInvestorType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    fundingAmount!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    fundUsage!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    otherFundUsage!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investmentType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    otherInvestmentType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessValuation!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    equityOffer!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    exitStrategy!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    partnerType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    partnerSkills!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    partnerInvolvement!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    otherPartnerInvolvement!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    equityCompensation!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    partnershipStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    otherPartnershipStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessChallenges!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessPriorities!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    supportNeeded!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    businessPlan!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    keyMilestones!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    longTermGoals!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    additionalInfo!: string;

    // Validate entity before insert or update
    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        await validateOrReject(this);
    }
}
