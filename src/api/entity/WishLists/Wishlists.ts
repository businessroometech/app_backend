import { BaseEntity,  Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Wishlists' })
export class Wishlists extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @Column({ type: "bool" , default: false})
  isHidden !: boolean;

  @Column({ type: "uuid" })
  userId !: string;

  @Column({ type: "uuid" })
  seekingConnectionId !: string;

}

