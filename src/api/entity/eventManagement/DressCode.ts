import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Event } from './Event';

@Entity({ name: "DressCode" })
export class DressCode extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eventId!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    gender?: string;

    @Column({ type: 'text' })
    dressCode!: string;
}
