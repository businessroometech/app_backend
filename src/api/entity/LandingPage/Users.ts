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

@Entity({ name: 'Users' })
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  userName!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'uuid', nullable: true })
  profilePictureUploadId!: string;

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

  @Column({ type: 'int', default: 0, nullable: true })
  active!: number;

  @Column({ type: 'simple-array', nullable: true })
  gstIns !: string[];

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

    if (!this.userName && this.emailAddress) {
      let baseUserName = this.emailAddress.split('@')[0];
      baseUserName = baseUserName.replace(/[^a-zA-Z0-9]/g, '');

      let userName = baseUserName;
      let exists = await Users.findOne({ where: { userName } });

      while (exists) {
        userName = `${baseUserName}${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await Users.findOne({ where: { userName } });
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
}
