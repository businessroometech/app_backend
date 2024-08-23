import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, } from 'typeorm';

@Entity({ name: "Payment" })
export class Payment extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // @Column({ type: 'uuid' })
    // paymentId!: string;

    @Column({ type: 'float', precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: "varchar" })
    currency!: string;

    @Column({ type: "varchar" })
    method!: string;

    @Column({ type: "varchar", default: 'Created' })
    status!: string;

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

    // @ManyToOne(() => Order, order => order.payments)
    // order: Order;

    // @ManyToOne(() => User, user => user.payments)
    // user: User;
}