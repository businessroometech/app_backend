import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, OneToOne, } from 'typeorm';
import { OrderItemBooking } from './OrderItemBooking';
import { Invoice } from '../../others/Invoice';

@Entity({ name: "Order" })
export class Order extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    customerId !: string;

    @Column({ type: 'varchar', default: 'not_generated' })
    refOrderId !: string;

    @Column({ type: 'uuid', nullable: true })
    invoiceId !: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalAmount !: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    totalTax !: number;

    @Column({ type: 'int' })
    totalItems !: number;

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

    @OneToMany(() => OrderItemBooking, item => item.order)
    orderItems !: OrderItemBooking[];

}