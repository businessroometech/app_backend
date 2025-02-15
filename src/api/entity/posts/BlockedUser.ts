import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';
import { Connection } from '../connection/Connections';

@Entity({ name: 'BlockedUser' })
export class BlockedUser extends BaseEntity {
  
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.blockedUsers, { eager: true })
  @JoinColumn({ name: 'blockedBy' })
  blocker!: PersonalDetails;

  @Column({ type: 'uuid' })
  blockedBy!: string;

  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.blockedByOthers, { eager: true })
  @JoinColumn({ name: 'blockedUser' })
  blocked!: PersonalDetails;

  @Column({ type: 'uuid' })
  blockedUser!: string;

  @ManyToOne(() => Connection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'connectionId' })
  connection?: Connection;

  @Column({ type: 'uuid', nullable: true })
  connectionId?: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)', precision: 6 })
  updatedAt!: Date;
}
