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

@Entity({ name: 'PersonalDetails' })
export class PersonalDetails extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  mobileNumber!: string;

  @Column({ type: 'uuid' })
  sectorId!: string;

  @Column({ type: 'uuid' })
  profilePicture!: string;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'date' })
  dob!: Date;

  @Column({ type: 'varchar', length: 255, unique: true })
  emailAddress!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  permanentAddress!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currentAddress!: string;

  @Column({ type: 'varchar', length: 14, unique: true, nullable: true })
  aadharNumber!: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  panNumber!: string;

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
