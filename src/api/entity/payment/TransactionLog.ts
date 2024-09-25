import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';

@Entity({ name: "TransactionLog" })
export class TransactionLog extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "uuid" })
    transactionId!: string;

    @Column({ type: "enum", enum: ['PaymentSuccess', 'PaymentFailure'] })
    event!: 'PaymentSuccess' | 'PaymentFailure';

    @Column({ type: 'jsonb', nullable: true })
    details?: object;

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
}
