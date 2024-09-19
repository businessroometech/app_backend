import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, } from 'typeorm';
// import { Service } from '../serviceProvider/service/ProvidedService';
// import { Cart } from './Cart';

// interface Address {
//     addressLine1: string,
//     addressLine2: string,
//     city: string,
//     state: string,
//     pincode: string,
// }

@Entity({ name: "CartItemBooking" })
export class CartItemBooking extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    cartId !: string;

    @Column({ type: "uuid" })
    sectorId !: string;

    @Column({ type: "uuid" })
    customerId !: string;

    @Column({ type: "uuid" })
    serviceProviderId !: string;

    @Column({ type: "uuid" })
    providedServiceId !: string;

    @Column({ type: "text" })
    workDetails !: string;

    @Column({ type: "float" })
    price !: number;

    @Column({ type: 'date' })
    deliveryDate!: string;

    @Column({ type: 'time' })
    deliveryTime!: string;

    @Column({ type: 'uuid' })
    deliveryAddressId!: string;

    @Column({ type: 'text', nullable: true })
    additionalNote!: string;

    @Column({ type: "simple-array" })  // this will store documnet ids
    attachments !: string[];

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

    // @ManyToOne(() => Service, service => service.cartItemBookings)
    // service!: Service;

    // @ManyToOne(() => Cart, cart => cart.cartItemBookings)
    // cart !: Cart;
}