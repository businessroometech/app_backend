import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';

export enum NotificationType {
  REACTION = 'reaction',
  COMMENT = 'comment',
  REPLY = 'reply',
  COMMENT_LIKE = 'commentLike',
  REPLY_LIKE = 'replyLike',
  REPOST = 'repost',
  REQUEST_RECEIVED = 'requestReceived',
  REQUEST_ACCEPTED = 'requestAccepted',
}

@Entity('Notify')
export class Notify extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'uuid' })
  recieverId!: string;

  @Column({ type: 'uuid' })
  senderId!: string;

  //   @ManyToOne(() => PersonalDetails, (user) => user.notifyRef, { onDelete: 'CASCADE' })
  //   @JoinColumn({ name: 'senderRef' })
  //   senderRef!: PersonalDetails;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'json', nullable: true })
  metaData!: Record<string, any>;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt!: Date;
}
