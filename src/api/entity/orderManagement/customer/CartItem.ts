import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, } from 'typeorm';
import { Service } from '../serviceProvider/service/Service';
import { Product } from '../serviceProvider/product/Product';
import { Cart } from './Cart';

@Entity({ name: "CartItem" })
export class CartItem extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    cartId !: string;

    @Column({ type: "enum", enum: ['Product', 'Service'] })
    type !: string;

    // if it's a product
    @Column({ type: "uuid", default: "" })
    productId !: string;

    @Column({ type: "int", default: 1 })
    quantity !: number;

    // if it's a service
    @Column({ type: "uuid", default: "" })
    serviceId !: string;

    @Column({ type: "float" })
    price !: number;

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

    @ManyToOne(() => Service, service => service.cartItems)
    service!: Service;

    @ManyToOne(() => Product, product => product.cartItems)
    product!: Product;

    @ManyToOne(() => Cart, cart => cart.cartItems)
    cart !: Cart;
}