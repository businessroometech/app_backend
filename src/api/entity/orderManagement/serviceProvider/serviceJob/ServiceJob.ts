import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, ManyToOne, JoinColumn, OneToOne, } from 'typeorm';
import { OrderItemBooking } from '../../customer/OrderItemBooking';
import { UserLogin } from '@/api/entity/user/UserLogin';

interface Address {
    addressLine1: string,
    addressLine2: string,
    city: string,
    state: string,
    pincode: string,
}

@Entity({ name: "ServiceJob" })
export class ServiceJob extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    orderItemBookingId!: string;

    @Column({ type: 'varchar' })
    jobId !: string;

    @Column({ type: 'uuid' })
    customerId!: string;

    @Column({ type: 'uuid' })
    serviceProviderId!: string;

    @Column({ type: "enum", enum: ["Pending", "Accepted", "Rejected", "InProcess", "Completed", "Cancelled"], default: "Pending" })
    status!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "text", nullable: true })
    note!: string;

    @Column({ type: 'varchar' })
    serviceCategory !: string;

    @Column({ type: "float" })
    price !: number;

    @Column({ type: 'date' })
    deliveryDate!: string;

    @Column({ type: 'varchar' })
    deliveryTime!: string;

    @Column({ type: 'json' })
    deliveryAddress!: Address;

    @Column({ type: 'varchar' })
    customerName !: string;

    @Column({ type: 'varchar' })
    customerMobileNumber !: string;

    @Column({ type: 'text'})
    reasonIfRejected !: string;

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

    @OneToOne(() => OrderItemBooking, item => item.serviceJobs)
    @JoinColumn({ name: "orderItemBookingId" })
    orderItemBooking!: OrderItemBooking;
}