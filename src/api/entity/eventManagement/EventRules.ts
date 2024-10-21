import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Event } from './Event';

@Entity({ name: "EventRules" })
export class EventRules extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'varchar', length: 100 })
    ruleType!: string;

    @Column({ type: 'text' })
    description!: string;
}
