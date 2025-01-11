import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BusinessForSale } from '../BuisnessSeller/BuisnessSeller';
import { BusinessBuyer } from '../BusinessBuyer/BusinessBuyer';
import { Entrepreneur } from '../Entrepreneur/EntrepreneurProfile';
import { Investor } from '../Investors/Investor';
import { Role } from '../Role/Role';
import { UserLogin } from '../user/UserLogin';

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

  @Column({ type: 'uuid' })
  userId!: string;

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

  @Column({ type: 'varchar', default: '' })
  bodyMeasurement!: string;

  @Column({ type: 'json' })
  permanentAddress!: Address;

  @Column({ type: 'json' })
  currentAddress!: Address;

  @Column({ type: 'uuid' })
  aadharNumberUploadId!: string;

  @Column({ type: 'uuid' })
  panNumberUploadId!: string;

  @Column({ type: 'varchar', length: 50 })
  roleType!: string;

  @Column({ type: 'uuid', nullable: true })
  roleId!: string;
  /*
  @OneToOne(() => Investor, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  investor!: Investor;

  @OneToOne(() => Entrepreneur, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  entrepreneur!: Entrepreneur;

  @OneToOne(() => BusinessBuyer, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  businessBuyer!: BusinessBuyer;

  @OneToOne(() => BusinessForSale, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  businessForSale!: BusinessForSale;
*/

  @ManyToOne(() => Role, (role) => role.personalDetails)
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
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

  @OneToOne(() => UserLogin, (user: any) => user.personalDetails)
  @JoinColumn({ name: 'userId' })
  user!: UserLogin;
}
