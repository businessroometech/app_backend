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

  @Column({ type: 'uuid' })
  sectorId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: "simple-array" })
  portfolioDocument!: string[];

  @Column({ type: 'int', nullable: true, default: 0 })
  totalYearsExperience!: number;

  @Column({ type: 'text', nullable: true })
  comments!: string;

  @Column({ type: 'varchar', length: 255 })
  preferredWorkType!: string;

  @Column({ type: 'varchar', length: 255 })
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
