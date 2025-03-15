import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: "SeekingConnections" })
export class SeekingConnections extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' }) 
    userId !: string;

    @Column({ type: "bool", default: false })
    isHidden !: boolean;

    @Column({ type: 'varchar', nullable: true })
    businessName!: string;

    @Column({ type: 'varchar', nullable: true })
    country!: string;

    @Column({ type: 'varchar', nullable: true })
    city!: string;

    @Column({ type: 'varchar', nullable: true })
    businessIdea!: string;

    @Column({ type: 'varchar', nullable: true })
    businessStage!: string;

    @Column({ type: 'varchar', nullable: true })
    businessIndustry!: string;

    @Column({ type: 'varchar', nullable: true })
    otherBusinessIndustry!: string;

    @Column({ type: 'varchar', nullable: true })
    businessDuration!: string;

    @Column({ type: 'varchar', nullable: true })
    businessProblem!: string;

    @Column({ type: 'varchar', nullable: true })
    businessTraction!: string;

    @Column({ type: 'varchar', nullable: true })
    investorType!: string;

    @Column({ type: 'varchar', nullable: true })
    otherInvestorType!: string;

    @Column({ type: 'varchar', nullable: true })
    fundingAmount!: string;

    @Column({ type: 'varchar', nullable: true })
    fundUsage!: string;

    @Column({ type: 'varchar', nullable: true })
    otherFundUsage!: string;

    @Column({ type: 'varchar', nullable: true })
    investmentType!: string;

    @Column({ type: 'varchar', nullable: true })
    otherInvestmentType!: string;

    @Column({ type: 'varchar', nullable: true })
    businessValuation!: string;

    @Column({ type: 'varchar', nullable: true })
    equityOffer!: string;

    @Column({ type: 'varchar', nullable: true })
    exitStrategy!: string;

    @Column({ type: 'varchar', nullable: true })
    partnerType!: string;

    @Column({ type: 'varchar', nullable: true })
    partnerSkills!: string;

    @Column({ type: 'varchar', nullable: true })
    partnerInvolvement!: string;

    @Column({ type: 'varchar', nullable: true })
    otherPartnerInvolvement!: string;

    @Column({ type: 'varchar', nullable: true })
    equityCompensation!: string;

    @Column({ type: 'varchar', nullable: true })
    partnershipStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    otherPartnershipStructure!: string;

    @Column({ type: 'varchar', nullable: true })
    businessChallenges!: string;

    @Column({ type: 'varchar', nullable: true })
    businessPriorities!: string;

    @Column({ type: 'varchar', nullable: true })
    supportNeeded!: string;

    @Column({ type: 'varchar', nullable: true })
    businessPlan!: string;

    @Column({ type: 'varchar', nullable: true })
    keyMilestones!: string;

    @Column({ type: 'varchar', nullable: true })
    longTermGoals!: string;

    @Column({ type: 'varchar', nullable: true })
    additionalInfo!: string;
}
