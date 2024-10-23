import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { Event } from './Event';
import { Ticket } from './Ticket';

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

    @ManyToOne(() => Event, event => event.eventBookings)
    event !: Event;

    @OneToMany(() => Ticket, ticket => ticket.eventBooking)
    tickets !: Ticket[];
}
