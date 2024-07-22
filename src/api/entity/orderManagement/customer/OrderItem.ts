import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, JoinColumn, } from 'typeorm';
import { Service } from '../serviceProvider/service/Service';
import { Product } from '../serviceProvider/product/Product';
import { Order } from './Order';

@Entity({ name: "OrderItem" })
export class OrderItem extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    orderId !: string;

    @Column({ type: "enum", enum: ['Product', 'Service'] })
    type !: string;

    // if it's a product
    @Column({ type: "uuid", default: null })
    productId !: string;

    @Column({ type: "int", default: 1 })
    quantity !: number;

    // if it's a service
    @Column({ type: "uuid", default: null })
    serviceId!: string;

    @Column({ type: "float" })
    price !: number;

    @Column({ type: 'date' })
    deliveryDate!: string;

    @Column({ type: 'time' })
    deliveryTime!: string;

    @Column({ type: 'json' })
    deliveryAddress!: string;

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

    @ManyToOne(() => Service, service => service.orderItems)
    service!: Service;

    @ManyToOne(() => Product, product => product.orderItems)
    product!: Product;

    @ManyToOne(() => Order, order => order.orderItems)
    order !: Order;
}