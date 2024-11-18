import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Event } from './Event';
import { EventDraft } from './EventDraft';

@Entity({ name: "EventMedia" })
export class EventMedia extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' , nullable:true})
    eventId!: string;

    // @Column({ type: 'uuid' , nullable:true})
    // eventDraftId!: string;

    @Column({ type: 'enum', enum: ['image', 'video', 'document'] })
    mediaType!: 'image' | 'video' | 'document';

    @Column({ type: 'text' })
    fileUrl!: string;

    @Column({ type: 'varchar', length: 255 })
    fileName!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    altText?: string;

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

    // @ManyToOne(() => Event, event => event.eventMedia)
    // event !: Event;

    // @ManyToOne(() => EventDraft, eventDraft => eventDraft.eventMedia)
    // eventDraft !: EventDraft;
}
