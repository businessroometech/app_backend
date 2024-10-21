import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Event } from './Event';

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
}
