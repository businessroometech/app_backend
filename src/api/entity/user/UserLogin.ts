import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from '../orderManagement/customer/OrderItem';

@Entity({ name: 'UserLogin' })
export class UserLogin extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'enum', enum: ['Customer', 'ServiceProvider'], default: 'ServiceProvider' })
  userType!: 'Customer' | 'ServiceProvider';

  @Column({ type: 'enum', enum: ['Individual', 'Business', 'NA'], default: 'NA' })
  serviceProviderType!: string;

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

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  static async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  @OneToMany(() => OrderItem, item => item.user)
  orderItems !: OrderItem[];
}
