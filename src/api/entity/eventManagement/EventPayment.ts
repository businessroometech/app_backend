import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn } from 'typeorm';

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
}
