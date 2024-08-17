import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemBooking } from '../../customer/OrderItemBooking';
// import { CartItemBooking } from '../../customer/CartItemBooking';
import { Category } from '@/api/entity/sector/Category';

// import { ServiceReview } from '../service/ServiceReview';
// import { OrderItem } from '../../customer/OrderItemBooking';
// import { CartItem } from '../../customer/CartItemBooking';

@Entity({ name: 'ProvidedService' })
export class ProvidedService extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  serviceProviderId!: string;

  @Column({ type: 'uuid' })
  sectorId!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'uuid' })
  subCategoryId!: string;

  @Column({ type: 'simple-array' })
  serviceIds!: string[];

  @Column({ type: 'varchar', length: 255 })
  experience!: string;

  // @Column({ type: 'varchar', length: 255 })
  // workType!: string;

  // @Column({ type: 'varchar', length: 255 })
  // whenCanStart!: string;

  // @Column({ type: 'varchar', length: 255 })
  // name!: string;

  @Column({ type: 'text' })
  bio!: string;

  @Column({ type: 'float' })
  price !: number;

  @Column({ type: 'varchar' })
  per !: string;

  @Column({ type: "simple-array" })
  uploadedImageIds !: string[];

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

  @OneToOne(() => Category, category => category.providedService)
  category !: Category;

  // @OneToMany(() => OrderItemBooking, orderItem => orderItem.providedService)
  // orderItemBookings !: OrderItemBooking[];

  // @OneToMany(() => CartItemBooking, cartItem => cartItem.service)
  // cartItemBookings !: CartItemBooking[];
}
