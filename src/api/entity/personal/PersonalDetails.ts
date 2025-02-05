import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Connection } from '../connection/Connections';
import { ProfileVisit } from '../notifications/ProfileVisit';
import { Mention } from '../posts/Mention';
import { Reaction } from '../posts/Reaction';

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

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  userName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  occupation!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  country!: string;

  @Column({ type: 'uuid', nullable: true })
  profilePictureUploadId!: string;

  @Column({ type: 'uuid', nullable: true })
  bgPictureUploadId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  dob!: Date;

  @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  emailAddress!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  gender!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  preferredLanguage!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  socialMediaProfile!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  height!: string;

  @Column({ type: 'varchar', default: '', nullable: true })
  weight!: string;

  @Column({ type: 'json', nullable: true })
  permanentAddress!: Address;

  @Column({ type: 'json', nullable: true })
  currentAddress!: Address;

  @Column({ type: 'uuid', nullable: true })
  aadharNumberUploadId!: string;

  @Column({ type: 'uuid', nullable: true })
  panNumberUploadId!: string;

  @Column({
    type: 'varchar',
    default: '',
  })
  userRole!: 'BusinessSeller' | 'Entrepreneur' | 'BusinessBuyer' | 'Investor';

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

  @Column({ type: 'int', default: 0, nullable: true })
  active!: number;

  @Column({ type: 'float', nullable: true })
  zoom !: number;

  @Column({ type: "float", nullable: true })
  rotate !: number;

  @Column({ type: 'float', nullable: true })
  zoomProfile !: number;

  @Column({ type: "float", nullable: true })
  rotateProfile !: number;


  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
    this.password = await bcrypt.hash(this.password, 10);

    if (!this.userName && this.emailAddress) {
      let baseUserName = this.emailAddress.split('@')[0];
      baseUserName = baseUserName.replace(/[^a-zA-Z0-9]/g, '');

      let userName = baseUserName;
      let exists = await PersonalDetails.findOne({ where: { userName } });

      while (exists) {
        userName = `${baseUserName}${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await PersonalDetails.findOne({ where: { userName } });
      }

      this.userName = userName;
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

  @OneToMany(() => Connection, (connection) => connection.requester)
  sentRequests!: Connection[];

  @OneToMany(() => Connection, (connection) => connection.receiver)
  receivedRequests!: Connection[];

  @OneToMany(() => ProfileVisit, (visit) => visit.visitor)
  profilesVisited!: ProfileVisit[];

  @OneToMany(() => ProfileVisit, (visit) => visit.visited)
  profileVisitors!: ProfileVisit[];

  @OneToMany(() => Reaction, (reaction) => reaction.id, {
    cascade: true,
  })
  reactions!: Reaction[];

  @ManyToMany(() => Mention, (mention) => mention.user)
  mentions!: Mention[];
}
