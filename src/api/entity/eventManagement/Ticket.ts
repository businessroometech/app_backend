import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { Event } from './Event';
import { randomBytes } from 'crypto';
import { EventBooking } from './EventBooking';
import { EventParticipant } from './EventParticipant';

@Entity({ name: "Ticket" })
export class Ticket extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'varchar', length: 100 })
    ticketType!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price!: number;

    @Column({ type: 'int' })
    quantityAvailable!: number;

    @Column({ type: 'boolean' })
    isFree!: boolean;

    @Column({ type: 'text', nullable: true })
    inclusions?: string;

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

    @ManyToOne(() => EventBooking, eventBooking => eventBooking.tickets)
    eventBooking !: EventBooking;

    @OneToMany(() => EventParticipant, eventParticipant => eventParticipant.ticket)
    eventParticipants !: EventParticipant[];
}
