import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';
import { UserPost } from '../UserPost';
import { randomBytes } from 'crypto';
import { NestedComment } from './NestedComment';
import { Comment } from './Comment';

@Entity({ name: 'Mention' })
export class Mention extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonalDetails, (user) => user.mentions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: PersonalDetails;

  @ManyToOne(() => UserPost, (post) => post.mentions, { nullable: true })
  post!: UserPost;

  @ManyToOne(() => Comment, (comment) => comment.mentions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment!: Comment;

  @ManyToOne(() => NestedComment, (nestedComment) => nestedComment.mentions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nestedCommentId' })
  nestedComment!: NestedComment;

  @Column({ type: 'varchar' })
  mentionBy!: string;

  @Column({ type: 'varchar' })
  mentionTo!: string;

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
