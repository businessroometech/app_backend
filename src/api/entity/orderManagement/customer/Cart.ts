import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, } from 'typeorm';
import { CartItemBooking } from './CartItemBooking';
import { CartItemProduct } from './CartItemProduct';

@Entity({ name: "Cart" })
export class Cart extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    customerId !: string;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    totalAmount !: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    totalTax !: number;

    @Column({ type: 'int', default: 0 })
    totalItems !: number;

    @Column({ type: 'boolean', default: true })
    isActive !: boolean;

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

    @OneToMany(() => CartItemBooking, item => item.cart)
    cartItemBookings !: CartItemBooking[];

    // @OneToMany(() => CartItemProduct, item => item.cart)
    // cartItemProducts !: CartItemProduct[];
}