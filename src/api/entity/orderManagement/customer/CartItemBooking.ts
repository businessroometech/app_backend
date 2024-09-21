import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne } from 'typeorm';
import { Cart } from './Cart';

@Entity({ name: "CartItemBooking" })
export class CartItemBooking extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "uuid" })
    cartId!: string;

    @Column({ type: "uuid" })
    sectorId!: string;

    @Column({ type: "uuid" })
    customerId!: string;

    @Column({ type: "uuid" })
    serviceProviderId!: string;

    @Column({ type: "uuid" })
    providedServiceId!: string;

    @Column({ type: "text" })
    workDetails!: string;

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

    @Column({ type: 'text', nullable: true })
    additionalNote!: string;

    @Column({ type: "simple-array" })  // store document IDs
    attachments!: string[];

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
        // Set UUID if not already generated
        if (!this.id) {
            this.id = this.generateUUID();
        }

        // Ensure 'mrp' is valid and provided
        if (!this.mrp || isNaN(this.mrp)) {
            throw new Error("Invalid 'mrp' value provided");
        }

        // Ensure 'discountPercentage' is valid, default to 0 if not provided
        if (this.discountPercentage === undefined || isNaN(this.discountPercentage)) {
            this.discountPercentage = 0;
        }

        // Calculate the discount amount based on the discount percentage
        this.discountAmount = (this.mrp * this.discountPercentage) / 100;

        // Calculate the taxable amount after discount
        const taxableAmount = this.mrp - this.discountAmount;
        this.price = taxableAmount;

        // Ensure 'cgstPercentage' and 'sgstPercentage' are valid, default to 9 if not provided
        if (this.cgstPercentage === undefined || isNaN(this.cgstPercentage)) {
            this.cgstPercentage = 9; // default CGST to 9%
        }

        if (this.sgstPercentage === undefined || isNaN(this.sgstPercentage)) {
            this.sgstPercentage = 9; // default SGST to 9%
        }

        // Calculate CGST and SGST
        const cgst = (taxableAmount * this.cgstPercentage) / 100;
        const sgst = (taxableAmount * this.sgstPercentage) / 100;

        // Set total tax
        this.totalTax = cgst + sgst;

        // Set total price after adding taxes
        this.totalPrice = this.price + this.totalTax;

        // Ensure totalPrice is not NaN
        if (isNaN(this.totalPrice)) {
            throw new Error("Invalid total price calculation");
        }
    }


    private generateUUID(): string {
        return randomBytes(16).toString('hex');
    }

    // @ManyToOne(() => Service, service => service.cartItemBookings)
    // service!: Service;

    @ManyToOne(() => Cart, cart => cart.cartItemBookings)
    cart !: Cart;
}
