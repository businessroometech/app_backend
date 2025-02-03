/* eslint-disable prettier/prettier */
import { randomBytes } from 'crypto';
import { BeforeInsert,Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OneToOne } from 'typeorm';

import { PersonalDetails } from '../personal/PersonalDetails';

@Entity({ name: "BusinessBuyer" })
export class BusinessBuyer {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({type: "varchar" ,  })
  UserId! : string

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessType!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessLocation!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessModel!: string;

  @Column({ type: 'decimal', nullable: true })
  budget!: number;

  @Column({ type: 'decimal', nullable: true })
  renovationInvestment!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timeline!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  growthOrStableCashFlow!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  supportAfterPurchase!: string;

  @Column({ type: 'boolean', nullable: true })
  ndaAgreement!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  additionalInfo!: string;

/*
  @OneToOne(() => PersonalDetails, (personalDetails) => personalDetails.businessBuyer)
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
