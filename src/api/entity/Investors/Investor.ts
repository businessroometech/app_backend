import { randomBytes } from 'crypto';
import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Investor' })
export class Investor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  UserId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  isAccredited!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  groupName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  investorType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  startupType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  startupStage!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  regionPreference!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  investmentSize!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  totalBudget!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  coInvesting!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  equityPercentage!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  investmentType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  involvementLevel!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  additionalSupport!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  previousInvestment!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  investmentExperience!: string;

  @Column({ type: 'int', nullable: true })
  startupsInvested!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  successStories!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  decisionMakingProcess!: string;

  @Column({ type: 'simple-array', nullable: true })
  evaluationCriteria!: string[];

  @Column({ type: 'varchar', length: 200, nullable: true })
  exitStrategy!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fundraisingStage!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  expectedInvolvement!: string;
  /*
  @OneToOne(() => PersonalDetails, (personalDetails) => personalDetails.investor)
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
