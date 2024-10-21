import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Ticket } from './Ticket';

@Entity({ name: "EventParticipant" })
export class EventParticipant extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'uuid', nullable: true })
    ticketId ?: Ticket;

    @Column({ type: 'enum', enum: ['attending', 'not_attending', 'waiting'] })
    status!: 'attending' | 'not_attending' | 'waiting';

    @Column({ type: 'date' })
    registrationDate!: string;
}
