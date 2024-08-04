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
// import { EducationalDetailsHealthcare } from "./EducationalDetailsHealthcare";

@Entity({ name: 'Award' })
export class Award extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: "uuid" })
  userLoginId !: string;

  @Column({ type: 'uuid' })
  educationalDetailsHealthcareId!: string;

  @Column({ type: 'varchar', length: 255 })
  awardName!: string;

  @Column({ type: 'int' })
  yearAwarded!: number;

  @Column({ type: 'varchar', length: 255 })
  fieldOfAward!: string;

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

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }
}
