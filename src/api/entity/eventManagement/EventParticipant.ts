import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Ticket } from './Ticket';
import { randomBytes } from 'crypto';
import { Event } from './Event';
import { EventDraft } from './EventDraft';

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

    @ManyToOne(() => Event, event => event.eventParticipants)
    event !: Event;

    @ManyToOne(() => Event, event => event.eventParticipants)
    eventDraft !: EventDraft;

    @ManyToOne(() => Ticket, ticket => ticket.eventParticipants)
    ticket !: Ticket;
}
