import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'Ristriction' })
export class Ristriction extends BaseEntity {

  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({  type: "int", default: 5})
  connectionCount !: number;
  
}
