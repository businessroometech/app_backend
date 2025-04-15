import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';

@Entity({ name: 'NestedCommentLike' })
export class NestedCommentLike extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => PersonalDetails, (user) => user.nestedCommentLikeRef, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userRef' })
  userRef!: PersonalDetails;

  @Column({ type: 'uuid' })
  postId!: string;

  @Column({ type: 'uuid' })
  commentId!: string;

  @Column({ type: 'uuid' })
  nestedCommentId!: string;

  @Column({ type: 'int', default: 0 })
  reactionId!: number;

  @Column({ type: 'bool', default: false })
  status!: boolean;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  updatedAt!: Date;

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
