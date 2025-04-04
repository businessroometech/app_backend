import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SellingStartup } from '../business-data/SellingStartup';

@Entity({ name: 'Wishlists' })
export class Wishlists extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: "bool", default: false })
  status!: boolean;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => SellingStartup, (startup) => startup.wishlists, { eager: true }) 
  @JoinColumn({ name: "sellingStartupId" }) 
  sellingStartup!: SellingStartup;

  // @Column({ type: "uuid" })
  // sellingStartupId!: string;
}
