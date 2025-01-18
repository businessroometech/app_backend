import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';

@Entity('connections')
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.sentRequests, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'requesterId' })
  requester!: PersonalDetails;

  @Column({ type: 'uuid' })
  requesterId!: string; 

  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.receivedRequests, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'receiverId' })
  receiver!: PersonalDetails;

  @Column({ type: 'uuid' })
  receiverId!: string; 

  @Column({ type: 'enum', enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status!: 'pending' | 'accepted' | 'rejected';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt!: Date;
}
