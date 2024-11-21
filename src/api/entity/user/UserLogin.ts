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
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemBooking } from '../orderManagement/customer/OrderItemBooking';
import { OrderItemProduct } from '../orderManagement/customer/OrderItemProduct';
import { ProvidedService } from '../orderManagement/serviceProvider/service/ProvidedService';
import { PersonalDetails } from '../profile/personal/PersonalDetails';
import { BusinessDetails } from '../profile/business/BusinessDetails';
import { Event } from '../eventManagement/Event';
import { EventDraft } from '../eventManagement/EventDraft';
import { SoldTicket } from '../eventManagement/SoldTicket';
import { PrimaryRoleMapping } from './PrimaryRoleMapping';

@Entity({ name: 'UserLogin' })
export class UserLogin extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  // @Column({ type: 'text' })
  // primaryRoleId !: string;

  @Column({ type: 'enum', enum: ['Individual', 'Business'] })
  userType !: 'Individual' | 'Business';

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

  @OneToMany(() => ProvidedService, providedService => providedService.users)
  providedServices !: ProvidedService[];

  @OneToMany(() => OrderItemBooking, item => item.user)
  orderItemBookings !: OrderItemBooking[];

  @OneToMany(() => OrderItemProduct, item => item.user)
  orderItemProducts !: OrderItemProduct[];

  @OneToOne(() => PersonalDetails, (details) => details.user, { cascade: true })
  personalDetails!: PersonalDetails;

  @OneToOne(() => BusinessDetails, (details) => details.user, { cascade: true })
  businessDetails!: BusinessDetails;

  @OneToMany(() => Event,(details) => details.user, { cascade: true })
  event!: Event;

  @OneToMany(() => EventDraft, (eventDraft) => eventDraft.user, { cascade: true })
  eventDrafts!: EventDraft[];
  
  @OneToMany(() => SoldTicket, (soldTicket) => soldTicket.boughtBy)
  soldTickets?: SoldTicket[];

  @OneToMany(() => PrimaryRoleMapping, prm => prm.user, { cascade: true })
  primaryRoles !: PrimaryRoleMapping[];

}
