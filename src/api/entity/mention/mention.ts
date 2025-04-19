import {
  BaseEntity,
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
import { NestedComment } from '../posts/NestedComment';
import { Comment } from '../posts/Comment';

// import { UserPostNew as UserPost } from '../UserPostNew';
// import { NestedCommentNew as NestedComment } from '../posts/NestedCommentNew';
// import { CommentNew as Comment } from '../posts/CommentNew';

@Entity({ name: 'UserMention' })
export class MentionUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonalDetails, (user) => user.mentionsReceived, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentionTo' })
  mentionTo!: PersonalDetails;

  @ManyToOne(() => PersonalDetails, (user) => user.mentionsMade, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentionBy' })
  mentionBy!: PersonalDetails;

  @ManyToOne(() => UserPost, (post) => post.mentions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  postId!: UserPost;

  @ManyToOne(() => Comment, (comment) => comment.mentions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  commentId!: Comment;

  @ManyToOne(() => NestedComment, (nestedComment) => nestedComment.mentions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nestedCommentId' })
  nestedCommentId!: NestedComment;

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
}
