import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Ristriction' })
export class Ristriction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'int', default: 50 })
  connectionCount!: number;

  @Column({ type: "bool", default: false })
  isBusinessProfileCompleted !: boolean;
}
