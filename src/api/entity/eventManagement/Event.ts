import { randomBytes } from 'crypto';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EventBooking } from './EventBooking';
import { DressCode } from './DressCode';
import { EventMedia } from './EventMedia';
import { EventParticipant } from './EventParticipant';
import { EventPayment } from './EventPayment';
import { EventRule } from './EventRule';
import { EventSchedule } from './EventSchedule';
import { PersonalDetails } from '../profile/personal/PersonalDetails';
import { login } from '@/api/controllers/auth/Login';
import { UserLogin } from '../user/UserLogin';
import { EventOrganiser } from './EventOrganiser';

@Entity({ name: 'Event' })
export class Event extends BaseEntity {
              @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true, default: 1 })
  count?: number;

  @Column({ type: 'enum', enum: ['Physical', 'Virtual'] })
  eventType!: 'Physical' | 'Virtual';

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string;

  @Column({ type: 'timestamp', nullable: true })
  startDatetime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDatetime!: Date;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ type: 'boolean', default: false })
  isInviteOnly!: boolean;

  @Column({ type: 'enum', enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'rescheduled'] })
  status!: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled';

  @Column({ type: 'varchar', length: 255, nullable: true })
  venueName?: string;

  @Column({ type: 'uuid' })
  addressId!: string;

  @Column({ type: 'text', nullable: true })
  bannerImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  mediaImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  livestreamLink?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  platformName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hostName?: string; 

  @Column({ type: 'text', nullable: true })
  mapLink?: string; 

  @Column({ type: 'char', length: 255, nullable: true, default: "false" })
  inclusions?: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  ageLimit?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  restrictions?: string;

  @Column({ type: 'text', nullable: true })
  meetingAccessLink?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  accessCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  additinalDetail?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  additinalTitle?: string;

  @Column({ type: 'simple-array', nullable:true })
  hashtags!: string[];

  @Column({ type: 'timestamp', nullable: true })
  registrationDeadline?: Date;

  @Column({ type: 'simple-array', nullable:true })
  organizerId!: string[];

  @Column({ type: 'simple-array', nullable:true })
  schedules!: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancellationFee?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundCharges?: number;
  
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

  @OneToMany(() => DressCode, (dressCode) => dressCode.event)
  dressCodes!: DressCode[];

  @OneToMany(() => EventBooking, (eventBooking) => eventBooking.event)
  eventBookings!: EventBooking[];

  @OneToMany(() => EventMedia, (eventMedia) => eventMedia.event)
  eventMedia!: EventMedia[];

  @OneToMany(() => EventParticipant, (eventParticipant) => eventParticipant.event)
  eventParticipants!: EventParticipant[];

  @OneToMany(() => EventPayment, (eventPayment) => eventPayment.event)
  eventPayments!: EventPayment[];

  @OneToMany(() => EventRule, (eventRule) => eventRule.event)
  eventRules!: EventRule[];

  @OneToMany(() => EventSchedule, (eventSchedule) => eventSchedule.event)
  eventSchedules!: EventSchedule[];

  @OneToMany(() => EventOrganiser, (organiser) => organiser.eventId)
  organiser!: EventOrganiser[];

  @ManyToOne(() => UserLogin, (user) => user.event)
  user!: UserLogin;
}
