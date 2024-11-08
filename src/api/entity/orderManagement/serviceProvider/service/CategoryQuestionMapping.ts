import { randomBytes } from 'crypto';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    BeforeInsert,
    ManyToOne,
} from 'typeorm';
import { ServiceQuestion } from './ServiceQuestion';

@Entity({ name: 'CategoryQuestionMapping' })
export class CategoryQuestionMapping extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    sectorId !: String;

    @Column({ type: 'uuid' })
    categoryId !: String;

    @Column({ type: 'uuid' })
    questionId !: String;

    @Column({ type: 'bool', default: true })
    isActive !: Boolean;

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

    @ManyToOne(() => ServiceQuestion, question => question.categoryQuestionMappings)
    serviceQuestion !: ServiceQuestion;
}
