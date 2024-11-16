import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    BaseEntity, 
    ManyToOne, 
    CreateDateColumn, 
    UpdateDateColumn, 
    OneToMany, 
    OneToOne 
} from 'typeorm';
import { Event } from './Event';
import { EventBooking } from './EventBooking';
import { EventParticipant } from './EventParticipant';
import { SoldTicket } from './SoldTicket';

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

    @Column({ type: 'simple-array', nullable: true })
    inclusions?: string[];

    @Column({ type: 'varchar', default: 'system' })
    createdBy!: string;

    @Column({ type: 'varchar', default: 'system', nullable: true })
    updatedBy?: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
    createdAt!: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
        precision: 6,
    })
    updatedAt!: Date;

    @ManyToOne(() => EventBooking, eventBooking => eventBooking.tickets, { nullable: true })
    eventBooking?: EventBooking;

    @OneToMany(() => EventParticipant, eventParticipant => eventParticipant.ticket)
    eventParticipants!: EventParticipant[];

    @OneToOne(() => SoldTicket, soldTicket => soldTicket.ticket, { nullable: true })
    soldTicket?: SoldTicket;
}
