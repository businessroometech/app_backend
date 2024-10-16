import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    BaseEntity,
} from 'typeorm';
import { randomBytes } from 'crypto';

@Entity({ name: 'Invoice' })
export class Invoice extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar" })
    invoiceNo !: string;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    issueDate!: string;

    @Column({ type: 'uuid' })
    customerId !: string;

    @Column({ type: 'uuid' })
    serviceProviderId !: string;

    @Column({ type: 'uuid' })
    orderId !: string;

    @Column({ type: 'uuid' })
    transactionId !: string;

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
