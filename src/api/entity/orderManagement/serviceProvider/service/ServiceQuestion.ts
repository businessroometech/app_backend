import { randomBytes } from 'crypto';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    BeforeInsert,
    OneToMany,
} from 'typeorm';
import { CategoryQuestionMapping } from './CategoryQuestionMapping';

@Entity({ name: 'ServiceQuestion' })
export class ServiceQuestion extends BaseEntity {
 
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text', nullable: false })
    questionText!: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    questionType!: string;

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
    userLogin: any;
    personalDetails: any;
    businessDetails: any;

    @BeforeInsert()
    async beforeInsert() {
        this.id = this.generateUUID();
    }

    private generateUUID(): string {
        return randomBytes(16).toString('hex');
    }

    @OneToMany(() => CategoryQuestionMapping, mapping => mapping.serviceQuestion)
    categoryQuestionMappings !: CategoryQuestionMapping[];
}
