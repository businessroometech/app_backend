import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, ManyToOne, JoinColumn, OneToOne, } from 'typeorm';
import { OrderItemBooking } from '../../customer/OrderItemBooking';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { UserAddress } from '@/api/entity/user/UserAddress';
import { PersonalDetailsCustomer } from '@/api/entity/profile/personal/PersonalDetailsCustomer';

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

    @Column({ type: "uuid" , nullable: true})
    invoiceId !: string;

    @Column({ type: "enum", enum: ["Pending", "Accepted", "Rejected", "InProcess", "Completed", "Cancelled", "Rescheduled"], default: "Pending" })
    status!: string;

    @Column({ type: "text" })
    workDetails!: string;

    @Column({ type: "text", default: "" })
    additionalNote!: string;

    @Column({ type: 'varchar' })
    serviceCategory !: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    mrp!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discountPercentage!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discountAmount!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 9 })  // CGST set to 9%
    cgstPercentage!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 9 })  // SGST set to 9%
    sgstPercentage!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 9 })  // CGST set to 9%
    cgstPrice!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 9 })  // SGST set to 9%
    sgstPrice!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    totalTax!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    totalPrice!: number;

    @Column({ type: 'date' })
    deliveryDate!: string;

    @Column({ type: 'varchar' })
    deliveryTime!: string;

    @Column({ type: 'uuid' })
    deliveryAddressId!: string;

    @Column({ type: 'varchar' })
    customerName !: string;

    @Column({ type: 'varchar' })
    customerMobileNumber !: string;

    @Column({ type: "simple-array" })  // store document IDs
    attachments!: string[];

    @Column({ type: 'text', default: "" })
    reasonIfRejected !: string;

    @Column({ type: 'text', default: "" })
    reasonIfCancelledByCustomer !: string;

    @Column({ type: 'text', default: "" })
    reasonIfReschedueledByCustomer !: string;

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

        const personalDetails = await PersonalDetailsCustomer.findOne({ where: { userId: this.customerId } });
        if (personalDetails) {
            this.customerName = personalDetails.fullName;
            this.customerMobileNumber = personalDetails.mobileNumber;
        };

        const orderItem = await OrderItemBooking.findOne({ where: { id: this.orderItemBookingId }, relations: ['providedService', 'providedService.subCategory'] });
        if (orderItem && orderItem.providedService) {
            // const subCategory = await SubCategory.findOne({ where: { id: orderItem.providedService.sub }});
            this.serviceCategory = orderItem.providedService.subCategory.subCategoryName;
        }
    }

    private generateUUID(): string {
        return randomBytes(16).toString('hex');
    }

    @OneToOne(() => OrderItemBooking, item => item.serviceJobs)
    @JoinColumn({ name: "orderItemBookingId" })
    orderItemBooking!: OrderItemBooking;

    @ManyToOne(() => UserAddress, userAddress => userAddress.serviceJobs)
    address !: UserAddress
}