import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany, } from 'typeorm';
import { OrderItem } from './OrderItem';

@Entity({ name: "Order" })
export class Order extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: "uuid" })
    userId !: string;

    @Column({ type: "uuid" })
    sectorId !: string;

    @Column({ type: "float" })
    totalAmount !: number;

    @Column({ type: 'int' })
    totalItems !: number; 

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

    @OneToMany(() => OrderItem, item => item.order)
    orderItems !: OrderItem[];

}