import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity({ name: "EventBooking" })
export class EventBooking extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'uuid' })
    ticketId!: string;

    @Column({ type: 'enum', enum: ['attending', 'not_attending', 'waiting'] })
    status!: 'attending' | 'not_attending' | 'waiting';

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amountPaid?: number;

    @Column({ type: 'date' })
    bookingDate!: string;
}
