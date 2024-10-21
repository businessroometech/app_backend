import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';

@Entity({ name: "EventMedia" })
export class EventMedia extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'enum', enum: ['image', 'video', 'document'] })
    mediaType!: 'image' | 'video' | 'document';

    @Column({ type: 'text' })
    fileUrl!: string;

    @Column({ type: 'varchar', length: 255 })
    fileName!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    altText?: string;
}
