/* eslint-disable prettier/prettier */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name : "StartupOverview"})
export class Entrepreneur {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({type: 'varchar', length: 200, nullable: true})
  businessIdea!: string;

  @Column({type: 'varchar', length: 100, nullable: true})
  currentStage!: string;

  @Column({type: 'varchar', length: 100, nullable: true})
  industrySector!: string;

  @Column({type: 'varchar', length: 50, nullable: true})
  operationDuration!: string;

  @Column({type: 'text', nullable: true})
  problemSolved!: string;

  @Column({type: 'text', nullable: true})
  targetAudience!: string;

  @Column({type: 'text', nullable: true})
  uniqueValueProposition!: string;

  @Column({type: 'text', nullable: true})
  traction!: string;

  @Column({type: 'varchar', length: 200, nullable: true})
  investorType!: string;

  @Column({type: 'varchar', length: 50, nullable: true})
  fundingAmount!: string;

  @Column({type: 'text', nullable: true})
  investmentUse!: string;

  @Column({type: 'varchar', length: 100, nullable: true})
  investmentType!: string;

  @Column({type: 'varchar', length: 100, nullable: true})
  currentValuation!: string;

  @Column({type: 'varchar', length: 50, nullable: true})
  equityForInvestment!: string;

  @Column({type: 'text', nullable: true})
  exitPlans!: string;

  @Column({type: 'text', nullable: true})
  businessPartnerType!: string;

  @Column({type: 'text', nullable: true})
  partnerExpertise!: string;

  @Column({type: 'varchar', length: 50, nullable: true})
  partnerInvolvementLevel!: string;

  @Column({type: 'varchar', length: 50, nullable: true})
  equityOrNonCashCompensation!: string;

  @Column({type: 'varchar', length: 100, nullable: true})
  partnershipStructure!: string;

  @Column({type: 'text', nullable: true})
  currentChallenges!: string;

  @Column({type: 'text', nullable: true})
  keyPriorities!: string;

  @Column({type: 'text', nullable: true})
  supportNeeded!: string;

  @Column({type: 'varchar', length: 50, nullable: true})
  businessPlanStatus!: string;

  @Column({type: 'text', nullable: true})
  upcomingMilestones!: string;

  @Column({type: 'text', nullable: true})
  longTermGoals!: string;

  @Column({type: 'text', nullable: true})
  founderMotivation!: string;

  @Column({type: 'text', nullable: true})
  additionalInfo!: string;
}
