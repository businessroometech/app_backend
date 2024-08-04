import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemBooking } from '../../customer/OrderItemBooking';
import { CartItemBooking } from '../../customer/CartItemBooking';
// import { Provider } from '../Provider';
// import { ProductReview } from '../product/ProductReview';
// import { OrderItem } from '../../customer/OrderItem';
// import { CartItem } from '../../customer/CartItem';

@Entity({ name: 'Product' })
export class Product extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  serviceProviderId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'float' })
  price!: number;

  @Column({ type: 'int', default: 1 })
  quantity !: number;

  @Column({ type: "enum", enum: ['Draft', 'Published'] })
  status !: string;

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

  // @ManyToOne(() => Provider, provider => provider.products)
  // provider !: Provider;

  // @OneToMany(() => ProductReview, review => review.product)
  // reviews !: ProductReview[];

  @OneToMany(() => OrderItemBooking, orderItem => orderItem.service)
  orderItems !: OrderItemBooking[];

  @OneToMany(() => CartItemBooking, cartItem => cartItem.service)
  cartItems !: CartItemBooking[];
}

