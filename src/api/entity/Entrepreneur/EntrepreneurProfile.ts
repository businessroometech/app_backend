/* eslint-disable prettier/prettier */
import { randomBytes } from 'crypto';
import { BeforeInsert,Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OneToOne } from 'typeorm';

import { PersonalDetails } from '../personal/PersonalDetails';

@Entity({name : "StartupOverview"})
export class Entrepreneur {

  @PrimaryGeneratedColumn("uuid")
  id!: string;
  @Column({ type: 'varchar', length: 200, nullable: true })
  businessName!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  UserId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessLocationCountry!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessLocationCity!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  businessIdea!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessStage!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industrySector!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessDuration!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  problemSolving!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  traction!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  investorType!: string;

  @Column({ type: 'decimal', nullable: true })
  fundingAmount!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  useOfFunds!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  investmentType!: string;

  @Column({ type: 'decimal', nullable: true })
  businessValuation!: number;

  @Column({ type: 'decimal', nullable: true })
  equityInExchange!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  exitPlans!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  partnerType!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  partnerSkills!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  partnerInvolvement!: string;

  @Column({ type: 'decimal', nullable: true })
  partnerEquityCompensation!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  partnershipStructure!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  businessChallenges!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keyPriorities!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  supportNeeded!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessPlanStatus!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  milestones!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  longTermGoals!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  additionalInfo!: string;
  
/*
  @OneToOne(() => PersonalDetails, (personalDetails) => personalDetails.entrepreneur)
  personalDetails!: PersonalDetails;
*/
   @BeforeInsert()
    async hashPasswordBeforeInsert() {
      this.id = this.generateUUID();
    }
  
    private generateUUID() {
      return randomBytes(16).toString('hex');
    }
}
