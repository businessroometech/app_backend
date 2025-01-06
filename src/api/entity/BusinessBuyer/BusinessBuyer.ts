/* eslint-disable prettier/prettier */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "BusinessBuyer" })
export class BusinessBuyer {

  @PrimaryGeneratedColumn("uuid")
  Id!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  BudgetForPurchasingBusiness!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  FinancingInPlace!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  PreferredMethodOfPayment!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  OpenToRenovationInvestment!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  PreviousBusinessOwnershipExperience!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ProfessionalBackgroundOrExpertise!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  SpecificSkillsOrQualifications!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  InvolvementLevel!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  MainGoalsInPurchasingBusiness!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  TimelineForPurchasingBusiness!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  LongTermBusinessGoalsAfterAcquisition!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  InterestedInGrowthOrStableCashFlow!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  DealBreakersInPurchasingBusiness!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  TeamOrStaffRequirementsOrPreferences!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  InterestedInSupportOrTraining!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  WillingToSignNDA!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  AdditionalBusinessBuyingPreferences!: string;
}
