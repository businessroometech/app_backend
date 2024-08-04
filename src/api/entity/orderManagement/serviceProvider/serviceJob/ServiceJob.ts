import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, ManyToOne, JoinColumn, OneToOne, } from 'typeorm';
import { OrderItemBooking } from '../../customer/OrderItemBooking';
import { UserLogin } from '@/api/entity/user/UserLogin';

@Entity({ name: "ServiceJob" })
export class ServiceJob extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    orderItemBookingId!: string;

    @Column({ type: 'uuid' })
    serviceProviderId!: string;

    @Column({ type: "enum", enum: ["Pending", "Accepted", "Rejected", "InProcess", "Completed"], default: "Pending" })
    status!: string;

    @Column({ type: "text", nullable: true })
    note!: string;

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

    // @ManyToOne(() => UserLogin, user => user.jobs)
    // @JoinColumn({ name: "serviceProviderId" })
    // serviceProvider!: UserLogin;

}