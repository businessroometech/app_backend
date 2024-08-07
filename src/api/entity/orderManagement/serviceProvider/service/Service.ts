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

// import { ServiceReview } from '../service/ServiceReview';
// import { OrderItem } from '../../customer/OrderItemBooking';
// import { CartItem } from '../../customer/CartItemBooking';

@Entity({ name: 'Service' })
export class Service extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  serviceProviderId!: string;

  @Column({ type: 'uuid' })
  sectorId!: string;
  
  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'float' })
  price !: number;

  @Column({ type: 'varchar' })
  per !: string;

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

  // @ManyToOne(() => Provider, provider => provider.services)
  // provider !: Provider;

  // @OneToMany(() => ServiceReview, review => review.service)
  // reviews !: ServiceReview[];

  @OneToMany(() => OrderItemBooking, orderItem => orderItem.service)
  orderItemBookings !: OrderItemBooking[];

  @OneToMany(() => CartItemBooking, cartItem => cartItem.service)
  cartItemBookings !: CartItemBooking[];
}
