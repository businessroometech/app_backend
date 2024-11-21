import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn, 
  OneToMany, 
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserLogin } from '../../user/UserLogin';

interface Address {
  addressLine1: string,
  addressLine2: string,
  city: string,
  state: string,
  pincode: string,
}

@Entity({ name: 'PersonalDetails' })
export class PersonalDetails extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sectorId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  profilePictureUploadId!: string;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'date' })
  dob!: Date;

  @Column({ type: 'varchar', length: 15, unique: true })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  emailAddress!: string;

  @Column({ type: 'text' })
  bio!: string;

  @Column({ type: 'json' })
  permanentAddress!: Address;

  @Column({ type: 'json' })
  currentAddress!: Address;

  @Column({ type: 'uuid' })
  aadharNumberUploadId!: string;

  @Column({ type: 'uuid' })
  panNumberUploadId!: string;

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

  @OneToOne(() => UserLogin, (user) => user.personalDetails)
  @JoinColumn({ name: "userId" })
  user!: UserLogin;

}
