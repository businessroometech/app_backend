import { randomBytes } from 'crypto';
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { Product } from './product/Product';
import { ProductReview } from './product/ProductReview';
import { Service } from './service/Service';
import { ServiceReview } from './service/ServiceReview';

@Entity({ name: "Provider" })
export class Provider extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @Column({ type: 'uuid' })
    userId !: string;

    @Column({ type: "uuid" })
    userDetails !: string

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

    
    @OneToMany(() => Product, product => product.provider)
    products !: Product[];
    
    @OneToMany(() => Service, service => service.provider)
    services !: Service[];
    
    @OneToMany(() => ProductReview, review => review.provider)
    serviceReviews !: ProductReview[];

    @OneToMany(() => ServiceReview, review => review.provider)
    productReviews !: ServiceReview[];
}