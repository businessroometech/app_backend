import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, BeforeUpdate } from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';
import { BlockedUser } from '../posts/BlockedUser';

@Entity({ name: 'Discussion' })
export class Discussion extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: "varchar", nullable: false})
    topic !: string;

    @Column({ type: "text" })
    content !: string;

    @Column({ type: "text" })
    question !: string;

    @Column({ type: "simple-array" })
    pollOptions !: string[];

    @Column({ type: 'bool', default: false })
    isActive!: boolean;

    @Column({ type: 'varchar', default: 'system' })
    createdBy!: string;

    @Column({ type: 'varchar', default: 'system' })
    updatedBy?: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
    updatedAt!: Date;

}
