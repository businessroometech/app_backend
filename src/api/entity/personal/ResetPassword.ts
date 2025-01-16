import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PersonalDetails } from './PersonalDetails';

@Entity({name:"ResetPassword"})
export class ResetPassword {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column({ type: 'varchar', default: 'system' })
  token!: string;

  @ManyToOne(() => PersonalDetails, (user) => user.id, { onDelete: 'CASCADE' })
  user!: PersonalDetails;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  expiresAt!: Date;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy!: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  updatedAt!: Date;
}
