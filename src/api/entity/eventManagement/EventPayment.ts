import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Event } from './Event';
import { EventDraft } from './EventDraft';

@Entity({ name: "EventPayment" })
export class EventPayment extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'simple-array' })
    eventParticipantIds!: string[];

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: 'enum', enum: ['pending', 'completed', 'refunded'] })
    paymentStatus!: 'pending' | 'completed' | 'refunded';

    @Column({ type: 'varchar', length: 100, nullable: true })
    paymentMethod?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    transactionId?: string;

    @Column({ type: 'date' })
    paymentDate!: string;

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

    @ManyToOne(() => Event, event => event.eventPayments)
    event !: Event;

    @ManyToOne(() => Event, event => event.eventPayments)
    eventDraft !: EventDraft;
}
