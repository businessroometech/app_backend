import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, JoinColumn, } from 'typeorm';
import { Service } from '../serviceProvider/service/Service';
import { Product } from '../serviceProvider/product/Product';
import { Order } from './Order';
import { Sector } from '../../Sector';
import { UserLogin } from '../../UserLogin';

interface Address {
    addressLine1: string,
    addressLine2: string,
    city: string,
    state: string,
    pincode: string,
}

@Entity({ name: "OrderItem" })
export class OrderItem extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: 'varchar' })
    OrderItemId !: string;

    @Column({ type: "uuid" })
    orderId !: string;

    @Column({ type: "uuid" })
    userId !: string;

    @Column({ type: "uuid" })
    sectorId !: string;

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

    @Column({ type: "enum", enum: ["NA", "Pending", "Accepted", "Rejected", "InProcess", "Completed", "Paid"] })
    serviceStatus !: string;

    @Column({ type: "text", nullable: true })
    serviceStatusNote !: string;

    @Column({ type: "float" })
    price !: number;

    @Column({ type: 'date' })
    deliveryDate!: string;

    @Column({ type: 'time' })
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
        this.OrderItemId = await this.generateOrderId();
    }

    private generateUUID(): string {
        return randomBytes(16).toString('hex');
    }

    private async generateOrderId(): Promise<string> {
        const cityCode = this.deliveryAddress.city.slice(0, 2).toLowerCase();
        const date = new Date();
        const dateCode = `${(date.getFullYear() % 100).toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

        const sectorCodes: { [key: string]: string } = {
            construction: '01',
            heathcare: '02',
            event: '03',
            entertainment: '04',
            petcare: '05',
            homeservice: '06'
        };

        const typeCodes: { [key: string]: string } = {
            Business: 'BA',
            Individual: 'IA'
        };

        const sectorName: string = this.sector.sectorName.toLowerCase();
        const sectorCode: string = sectorCodes[sectorName] || 'XX';
        const typeCode = typeCodes[this.user.serviceProviderType] || "XX";

        let count = await OrderItem.count();
        let orderSeq = (count + 1).toString();
        if (orderSeq.length < 0) orderSeq.padStart(4, '0');

        return `${cityCode}${dateCode}${sectorCode}${typeCode}${orderSeq}`;
    }

    @ManyToOne(() => Service, service => service.orderItems)
    service!: Service;

    @ManyToOne(() => Product, product => product.orderItems)
    product!: Product;

    @ManyToOne(() => Order, order => order.orderItems)
    order !: Order;

    @ManyToOne(() => Sector, sector => sector.orderItems)
    sector !: Sector

    @ManyToOne(() => UserLogin, user => user.orderItems)
    user !: UserLogin;
}