/* eslint-disable prettier/prettier */


import { BaseEntity,  Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Wishlists' })
export class Wishlists extends BaseEntity {

  @PrimaryGeneratedColumn('uuid') // This auto-generates a UUID
  id!: string;
  
  @Column({ type: 'varchar', length: 100 })
  Identity!: string;

  @Column('json')
  Wishlistdata!: any[]; // If you know the structure, consider being more specific

}

