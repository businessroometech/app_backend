import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Event } from './Event';
import { randomBytes } from 'crypto';

@Entity({ name: "EventSchedule" })
export class EventSchedule extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'timestamp' })
    startTime!: Date;

    @Column({ type: 'timestamp' })
    endTime!: Date;

    @Column({ type: 'text', nullable: true })
    description?: string;

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

    @ManyToOne(() => Event, event => event.eventSchedules)
    event !: Event;
}
