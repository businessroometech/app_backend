import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Event } from './Event';
import { randomBytes } from 'crypto';
import { EventDraft } from './EventDraft';

@Entity({ name: "EventRule" })
export class EventRule extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable:true })
    eventId!: string;

    // @Column({ type: 'uuid', nullable:true })
    // eventDraftId!: string;

    @Column({ type: 'varchar', length: 100 })
    ruleType!: string;

    @Column({ type: 'text' })
    description!: string;

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

    // @ManyToOne(() => Event, event => event.eventRules)
    // event !: Event;

    // @ManyToOne(() => EventDraft, eventDraft => eventDraft.eventRules)
    // eventDraft !: EventDraft;
}
