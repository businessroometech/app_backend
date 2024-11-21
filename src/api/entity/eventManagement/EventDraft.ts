import { randomBytes } from "crypto";
import { BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DressCode } from "./DressCode";
import { EventBooking } from "./EventBooking";
import { EventMedia } from "./EventMedia";
import { EventParticipant } from "./EventParticipant";
import { EventPayment } from "./EventPayment";
import { EventRule } from "./EventRule";
import { EventSchedule } from "./EventSchedule";
import { EventOrganiser } from "./EventOrganiser";
import { UserLogin } from "../user/UserLogin";

@Entity({ name: 'EventDraft' })
export class EventDraft extends BaseEntity {
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
  bannerImageId?: string;

  // @Column({ type: 'text', nullable: true })
  // mediaImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  livestreamLink?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  platformName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hostName?: string;

  @Column({ type: 'text', nullable: true })
  mapLink?: string;

  @Column({ type: 'char', length: 255, nullable: true, default: 'false' })
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

  @Column({ type: 'simple-array', nullable: true })
  hashtags!: string[];

  @Column({ type: 'timestamp', nullable: true })
  registrationDeadline?: Date;

  @Column({ type: 'simple-array', nullable: true })
  organizer!: string[];

  @Column({ type: 'simple-array', nullable: true })
  schedules!: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancellationFee?: number;

  @Column({ type: 'varchar', precision: 10, scale: 2, nullable: true })
  cancellationMedia?: string;

  @Column({ type: 'varchar', precision: 10, scale: 2, nullable: true })
  refundMedia?: string;

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

  // @OneToMany(() => DressCode, (dressCode) => dressCode.eventDraft)
  // dressCodes!: DressCode[];

  // @OneToMany(() => EventBooking, (eventBooking) => eventBooking.eventDraft)
  // eventBookings!: EventBooking[];

  // @OneToMany(() => EventMedia, (eventMedia) => eventMedia.eventDraft)
  // eventMedia!: EventMedia[];

  // @OneToMany(() => EventParticipant, (eventParticipant) => eventParticipant.eventDraft)
  // eventParticipants!: EventParticipant[];

  // @OneToMany(() => EventPayment, (eventPayment) => eventPayment.eventDraft)
  // eventPayments!: EventPayment[];

  // @OneToMany(() => EventRule, (eventRule) => eventRule.eventDraft)
  // eventRules!: EventRule[];

  // @OneToMany(() => EventSchedule, (eventSchedule) => eventSchedule.eventDraft)
  // eventSchedules!: EventSchedule[];

  // @OneToMany(() => EventOrganiser, (organiser) => organiser.eventDraft)
  // organisers!: EventOrganiser[];

  @ManyToOne(() => UserLogin, (user) => user.eventDrafts)
  @JoinColumn({ name: 'userId' }) 
  user!: UserLogin;
}
