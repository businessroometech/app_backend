import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, JoinColumn, OneToOne, OneToMany, } from 'typeorm';
import { ProvidedService } from '../serviceProvider/service/ProvidedService';
// import { Product } from '../serviceProvider/product/ProvidedProduct';
import { Order } from './Order';
import { Sector } from '../../sector/Sector';
import { UserLogin } from '../../user/UserLogin';
import { ServiceJob } from '../serviceProvider/serviceJob/ServiceJob';
import { UserAddress } from '../../user/UserAddress';

@Entity({ name: "OrderItemBooking" })
export class OrderItemBooking extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: 'varchar' })
    OrderItemId !: string;

    @Column({ type: "uuid" })
    orderId !: string;

    @Column({ type: "uuid" })
    sectorId !: string;

    @Column({ type: "uuid" })
    customerId !: string;

    @Column({ type: "uuid" })
    serviceProviderId !: string;

    @Column({ type: "uuid" })
    providedServiceId!: string;

    @Column({ type: "enum", enum: ["Pending", "Assigned", "Rejected", "Completed", "Cancelled", "Rescheduled"], default: "Pending" })
    status !: string;

    @Column({ type: "text", default: "" })
    workDetails !: string;

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
    deliveryAddressId !: string;

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
        if (!this.id) this.id = this.generateUUID();
        // Ensure address is loaded if necessary
        if (!this.address) {
            const foundAddress = await UserAddress.findOne({ where: { id: this.deliveryAddressId } });

            if (!foundAddress) {
                throw new Error('Address not found for the given deliveryAddressId');
            }

            this.address = foundAddress;
        }
        if (!this.sector) {
            const foundSector = await Sector.findOne({ where: { id: this.sectorId } });

            if (!foundSector) {
                throw new Error('Sector not found for the given sectorId');
            }

            this.sector = foundSector;
        }
        if (!this.user) {
            const foundUser = await UserLogin.findOne({ where: { id: this.serviceProviderId } });

            if (!foundUser) {
                throw new Error('User not found for the given serviceProviderId');
            }

            this.user = foundUser;
        }

        if (!this.OrderItemId) this.OrderItemId = await this.generateOrderId();
    }

    private generateUUID(): string {
        return randomBytes(16).toString('hex');
    }

    private async generateOrderId(): Promise<string> {
        const cityCode = this.address.city.slice(0, 2).toLowerCase();
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
            Business: 'BU',
            Individual: 'IN'
        };

        const sectorName: string = this.sector.sectorName.toLowerCase();
        const sectorCode: string = sectorCodes[sectorName] || 'XX';
        const typeCode = typeCodes[this.user.userType] || "XX";

        let count = await OrderItemBooking.count();
        let orderSeq = (count + 1).toString();
        if (orderSeq.length < 0) orderSeq.padStart(4, '0');

        return `${cityCode}${dateCode}${sectorCode}${typeCode}${orderSeq}`;
    }

    @ManyToOne(() => ProvidedService, service => service.orderItemBookings)
    providedService!: ProvidedService;

    // @ManyToOne(() => Product, product => product.orderItemProducts)
    // product!: Product;

    @ManyToOne(() => Order, order => order.orderItems)
    order !: Order;

    @ManyToOne(() => Sector, sector => sector.orderItems)
    sector !: Sector

    @ManyToOne(() => UserLogin, user => user.orderItemBookings)
    user !: UserLogin;

    @OneToOne(() => ServiceJob, job => job.orderItemBooking)
    serviceJobs !: ServiceJob;

    @OneToMany(() => UserAddress, userAddress => userAddress.orderItemBooking)
    address !: UserAddress;
}

