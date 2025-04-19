import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  BeforeUpdate,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';
import { BlockedUser } from '../posts/BlockedUser';

@Entity('connectionsNew')
export class ConnectionsNew extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.sentRequests, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'requester' })
  requester!: PersonalDetails;

  @Column({ type: 'uuid' })
  requesterId!: string;

  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.receivedRequests, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'receiver' })
  receiver!: PersonalDetails;

  @Column({ type: 'uuid' })
  receiverId!: string;

  @Column({ type: 'enum', enum: ['pending', 'accepted', 'rejected', 'block'], default: 'pending' })
  status!: 'pending' | 'accepted' | 'rejected' | 'block';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt!: Date;

  @BeforeUpdate()
  async handleBlocking() {
    if (this.status === 'block') {
      await BlockedUser.create({
        blockedBy: this.requesterId,
        blockedUser: this.receiverId,
        connectionId: this.id,
        reason: 'User blocked via connection',
      }).save();
    }
  }
}
