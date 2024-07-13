import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'ProfessionalDetails' })
export class ProfessionalDetails extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  mobileNumber!: string;

  @Column({ type: 'uuid' })
  sectorId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workType!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alternateWorks!: string;

  @Column({ type: 'uuid' })
  portfolioDocument!: string;

  @Column({ type: 'int', nullable: true })
  totalYearsExperience!: number;

  @Column({ type: 'text', nullable: true })
  anyComments!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  preferredWorkType!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  preferredLocation!: string;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system', nullable: true })
  updatedBy!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  updatedAt!: Date;

  @BeforeInsert()
  async beforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
