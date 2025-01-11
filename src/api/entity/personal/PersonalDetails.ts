import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

@Entity({ name: 'PersonalDetails' })
export class PersonalDetails extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  occupation!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', default: '' })
  country!: string;

  @Column({ type: 'uuid' })
  profilePictureUploadId!: string;

  @Column({ type: 'uuid' })
  bgPictureUploadId!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'date' })
  dob!: Date;

  @Column({ type: 'varchar', length: 15, unique: true })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  emailAddress!: string;

  @Column({ type: 'text' })
  bio!: string;

  @Column({ type: 'varchar', default: '' })
  gender!: string;

  @Column({ type: 'varchar', default: '' })
  preferredLanguage!: string;

  @Column({ type: 'varchar', default: '' })
  socialMediaProfile!: string;

  @Column({ type: 'varchar', default: '' })
  height!: string;

  @Column({ type: 'varchar', default: '' })
  weight!: string;

  @Column({ type: 'json' })
  permanentAddress!: Address;

  @Column({ type: 'json' })
  currentAddress!: Address;

  @Column({ type: 'uuid' })
  aadharNumberUploadId!: string;

  @Column({ type: 'uuid' })
  panNumberUploadId!: string;

  @Column({
    type: 'varchar',
    default: 'Others',
  })
  userRole!: 'BusinessSeller' | 'Entrepreneur' | 'BusinessBuyer' | 'Investor' | 'Others';

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy!: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  updatedAt!: Date;

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
    this.password = await bcrypt.hash(this.password, 10);
  }

  @BeforeUpdate()
  async updateTimestamp() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  static async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
