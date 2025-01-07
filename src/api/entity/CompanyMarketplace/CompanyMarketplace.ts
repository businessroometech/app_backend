/* eslint-disable prettier/prettier */ // Disables Prettier for the whole file

import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'CompanyMarketPlace' })
export class CompanyMarketPlace extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @Column({ type: 'varchar', length: 200 })
  companyname!: string;

  @Column({ type: 'varchar', length: 200 })
  companyDescription!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  companyRevenue!: number;

  @Column({ type: 'varchar', length: 200 })
  startupCategories!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  last12MonthsProfit!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  askingPrice!: number;

  @Column({ type: 'varchar', length: 200 })
  listedBy!: string;
  
  @Column({ type: 'varchar', length: 255 })
  companyLogoKey!: string;
    
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date;
}
