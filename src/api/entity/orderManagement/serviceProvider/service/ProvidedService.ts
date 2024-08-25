import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemBooking } from '../../customer/OrderItemBooking';
import { Category } from '@/api/entity/sector/Category';
import { SubCategory } from '@/api/entity/sector/SubCategory';
import { Service } from '@/api/entity/sector/Service';

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

  @Column({ type: 'simple-array', })
  certificates!: string[];

  @Column({ type: 'simple-array', })
  typeOfProjects !: string[];

  @Column({ type: 'text', })
  projectScaleExpertise !: string;

  @Column({ type: 'simple-array', })
  typeOfWorkforce!: string[];

  @Column({ type: 'simple-array', })
  typesOfClients !: string[];

  @Column({ type: 'float' })
  price !: number;

  @Column({ type: 'varchar' })
  per !: string;

  @Column({ type: 'text' })
  bio!: string;

  @Column({ type: "simple-array" })
  uploadedImageIds !: string[];

  @Column({ type: "boolean", default: true })
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

  @ManyToOne(() => Category, category => category.providedServices)
  category !: Category;

  @ManyToOne(() => SubCategory, subCategory => subCategory.providedServices)
  subCategory !: SubCategory;

  @OneToMany(() => OrderItemBooking, orderItem => orderItem.providedService)
  orderItemBookings !: OrderItemBooking[];

  @ManyToOne(() => Service, service => service.providedService)
  services !: Service[];
}
