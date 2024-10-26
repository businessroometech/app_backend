import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, } from 'typeorm';
// import { Product } from '../serviceProvider/product/ProvidedProduct';
// import { Cart } from './Cart';

interface Address {
    addressLine1: string,
    addressLine2: string,
    city: string,
    state: string,
    pincode: string,
}

@Entity({ name: "CartItemProduct" })
export class CartItemProduct extends BaseEntity {

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

    @Column({ type: "uuid", default: "" })
    productId !: string;

    @Column({ type: "int", default: 1 })
    quantity !: number;

    @Column({ type: "float" })
    price !: number;

    @Column({ type: 'date' })
    deliveryDate!: string;

    @Column({ type: 'varchar' })
    deliveryTime!: string;

    @Column({ type: 'json' })
    deliveryAddress!: Address;

    @Column({ type: 'text', nullable: true })
    additionalNote!: string;

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

    // @ManyToOne(() => Product, product => product.cartItemProducts)
    // cartProduct!: Product;

    // @ManyToOne(() => Cart, cart => cart.cartItemProducts)
    // cart !: Cart;
}