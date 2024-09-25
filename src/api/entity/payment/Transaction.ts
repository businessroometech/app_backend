import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, } from 'typeorm';

@Entity({ name: "Transaction" })
export class Transaction extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    userId !: string;

    @Column({ type: "uuid" })
    orderId !: string;

    @Column({ type: "varchar" })
    currency!: string;

    @Column({ type: "varchar" })
    method!: string;

    @Column({ type: "uuid" })
    razorpayOrderId !: string;

    @Column({ type: "uuid" })
    razorpayPaymentId !: string;

    @Column({ type: 'float', precision: 10, scale: 4 })
    amount!: number;

    @Column({
        type: 'enum',
        enum: ['Payment', 'Refund']
    })
    transactionType !: 'Payment' | 'Refund';

    @Column({ type: "varchar" })
    status !: string;

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