import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import { EventBooking } from './EventBooking';
import { DressCode } from './DressCode';
import { EventMedia } from './EventMedia';
import { EventParticipant } from './EventParticipant';
import { EventPayment } from './EventPayment';
import { EventRule } from './EventRule';
import { EventSchedule } from './EventSchedule';

@Entity({ name: "Event" })
export class Event extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: ['Physical', 'Virtual'] })
    eventType!: 'Physical' | 'Virtual';

    @Column({ type: 'varchar', length: 100 })
    category!: string;

    @Column({ type: 'timestamp' })
    startDatetime!: Date;

    @Column({ type: 'timestamp' })
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
    livestreamLink?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    platformName?: string;

    @Column({ type: 'text', nullable: true })
    meetingAccessLink?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    accessCode?: string;

    @Column({ type: 'timestamp', nullable: true })
    registrationDeadline?: Date;

    @Column({ type: 'uuid' })
    organizerId!: string;

    @Column({ type: 'simple-array' })
    schedules!: string[];

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

    @OneToMany(() => DressCode, dressCode => dressCode.event)
    dressCodes !: DressCode[];

    @OneToMany(() => EventBooking, eventBooking => eventBooking.event)
    eventBookings !: EventBooking[];

    @OneToMany(() => EventMedia, eventMedia => eventMedia.event)
    eventMedia !: EventMedia[];

    @OneToMany(() => EventParticipant, eventParticipant => eventParticipant.event)
    eventParticipants !: EventParticipant[];

    @OneToMany(() => EventPayment, eventPayment => eventPayment.event)
    eventPayments !: EventPayment[];

    @OneToMany(() => EventRule, eventRule => eventRule.event)
    eventRules !: EventRule[];

    @OneToMany(() => EventSchedule, eventSchedule => eventSchedule.event)
    eventSchedules !: EventSchedule[];

}
