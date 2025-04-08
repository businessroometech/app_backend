import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { PersonalDetails } from '../personal/PersonalDetails';
import { UserPost } from '../UserPost';
import { NestedComment } from '../posts/NestedComment';
import { Comment } from '../posts/Comment';

@Entity({ name: 'Hashtags' })
export class Hashtag extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  tag!: string;

  // @ManyToMany(() => UserPost, (post) => post.hashtag)
  // @JoinTable({
  //   name: 'hashtag_posts', // name of the join table
  //   joinColumn: {
  //     name: 'hashtag_id', // current table (Hashtag)
  //     referencedColumnName: 'id',
  //   },
  //   inverseJoinColumn: {
  //     name: 'post_id', // related table (Post)
  //     referencedColumnName: 'id',
  //   },
  // })
  // posts!: UserPost[];

  // @ManyToMany(() => Comment, (comment) => comment.hashtag)
  // @JoinTable({
  //   name: 'hashtag_comments',
  //   joinColumn: {
  //     name: 'hashtag_id',
  //     referencedColumnName: 'id',
  //   },
  //   inverseJoinColumn: {
  //     name: 'comment_id',
  //     referencedColumnName: 'id',
  //   },
  // })
  // comments!: Comment[];

  // @ManyToMany(() => NestedComment, (nestedComment) => nestedComment.hashtag)
  // @JoinTable({
  //   name: 'hashtag_nestedComments',
  //   joinColumn: {
  //     name: 'hashtag_id',
  //     referencedColumnName: 'id',
  //   },
  //   inverseJoinColumn: {
  //     name: 'nestedComment_id',
  //     referencedColumnName: 'id',
  //   },
  // })
  // nestedComments!: NestedComment[];

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
