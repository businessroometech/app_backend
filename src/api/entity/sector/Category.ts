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
import { ProvidedService } from '../orderManagement/serviceProvider/service/ProvidedService';
import { UserCategoryMapping } from '../user/UserCategoryMapping';

@Entity({ name: 'Category' })
export class Category extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  sectorId!: string;

  @Column({ type: 'varchar' })
  categoryName!: string;

  @Column({ type: 'text' })
  categoryDescription!: string;

  @Column({ type: 'text' })
  imageKey !: string;

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

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }

  @OneToMany(() => ProvidedService, providedService => providedService.category)
  providedServices !: ProvidedService[];

  @OneToMany(() => UserCategoryMapping, userCategoryMapping => userCategoryMapping.category)
  userCategoryMappings !: UserCategoryMapping[];
}
