import { randomBytes } from 'crypto';
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne } from 'typeorm';
import { OrderItemBooking } from '../orderManagement/customer/OrderItemBooking';

@Entity({ name: 'UserAddress' })
export class UserAddress extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    userId !: string;

    @Column({ type: "varchar" }) // Home, Office etc
    title !: string;

    @Column({ type: "varchar" })
    addressLine1 !: string;

    @Column({ type: "varchar" })
    addressLine2 !: string;

    @Column({ type: "varchar" })
    city !: string;

    @Column({ type: "varchar" })
    state !: string;

    @Column({ type: "varchar" })
    pincode !: string;

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

    private generateUUID() {
        return randomBytes(16).toString('hex');
    }

    @ManyToOne(() => OrderItemBooking, orderItem => orderItem.address)
    orderItemBooking !: OrderItemBooking;
};