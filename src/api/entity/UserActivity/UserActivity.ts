import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PersonalDetails } from "../personal/PersonalDetails";

@Entity({ name: 'UserActivity' })
export class UserActivity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: number;

    @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.userActivity, {
        nullable: false,
        eager: true, // data is populated when querying this Entity
    })
    @JoinColumn({ name: 'userId' })
    userId!: PersonalDetails;

    @Column({ type: 'varchar', length: 255 })
    activity!: 'activity 1' | 'activity 2' | 'activity 3';

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        precision: 6,
    })
    createdAt!: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
        precision: 6,
    })
    updatedAt!: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    createdBy!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    updatedBy!: string;
}
