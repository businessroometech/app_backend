import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity({ name: "EventDraft" })
export class EventDraft extends BaseEntity {

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
}
