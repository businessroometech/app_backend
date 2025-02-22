/* eslint-disable prettier/prettier */

import { randomBytes } from 'crypto';
import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name :"General"})
export class General {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  currentRole!: string;

  @Column({ type: 'uuid' })
  UserId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName!: string;

  @Column({ type: 'varchar', length: 100 })
  location!: string;

  @Column({ type: 'varchar', length: 50 })
  businessType!: string;

  @Column({ type: 'text', nullable: true })
  areasOfExpertise!: string;

  @Column({ type: 'text', nullable: true })
  joiningReason!: string;

  @Column('simple-array')
  contentPreferences!: string[];

  @Column({ type: 'varchar', length: 10 })
  collaborationInterest!: string;

  @Column({ type: 'varchar', length: 20 })
  businessStage!: string;

  @Column({ type: 'varchar' })
  hasPartnerships!: string;

  @Column({ type: 'varchar' })
  hasEntrepreneurialExperience!: string;

  @Column('varchar')
  primaryGoals!: string;


    @BeforeInsert()
    async hashPasswordBeforeInsert() {
      this.id = this.generateUUID();
    }
  
    private generateUUID() {
      return randomBytes(16).toString('hex');
    }
}
