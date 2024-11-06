import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Dropdown {
  @PrimaryGeneratedColumn('uuid')
  id!: string;  

  @Column('simple-array', { nullable: true })
  eventType?: string[]; 

  @Column('simple-array', { nullable: true })
  gender?: string[];  

  @Column('simple-array', { nullable: true })
  entryType?: string[];  
}
