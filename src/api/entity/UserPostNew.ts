import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reaction } from './posts/Reaction';
import { MentionUser } from './mention/mention';
// import { nullable } from 'zod';
// import { Hashtag } from './Hashtag/Hashtag';
import { PersonalDetails } from './personal/PersonalDetails';

@Entity({ name: 'UserPostNew' })
export class UserPostNew extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => PersonalDetails, (user) => user.user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userIdRef' })
  userIdRef!: PersonalDetails;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string;

  @Column({ type: 'text', nullable: true })
  content!: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string[];

  @Column({ type: 'json', nullable: true })
  mediaKeys?: { key: string; type: string }[];

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date;

  // for repost

  @Column({ type: 'boolean', default: false })
  isRepost!: boolean;

  @Column({ type: 'uuid', default: null })
  repostedFrom!: string;

  @Column({ type: 'text', default: null })
  repostText!: string;

  @CreateDateColumn({ type: 'timestamp' })
  originalPostedAt!: Date;

  @Column({ type: 'varchar' })
  originalPostedTimeline!: String;

  @Column({ type: 'int' })
  repostCount!: number;

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  // for discussion

  @Column({ type: 'bool', default: false })
  isDiscussion!: boolean;

  @Column({ type: 'varchar', nullable: true })
  discussionTopic!: string;

  @Column({ type: 'text', nullable: true })
  discussionContent!: string;

  @Column({ type: 'boolean', default: false })
  isPoll!: boolean;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'json', nullable: true })
  pollOptions?: { option: string; votes: number }[];

  @Column({ type: 'varchar', nullable: true })
  pollDuration!: string;

  @BeforeInsert()
  private async beforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }

  // @OneToMany(() => Reaction, (reaction) => reaction.post, {
  //   cascade: true,
  // })
  // reactions!: Reaction[];

  @OneToMany(() => MentionUser, (mention) => mention.postId, {
    cascade: true,
  })
  mentions!: MentionUser[];

  // @ManyToMany(() => Hashtag, (hashtag) => hashtag.posts)
  // hashtag!: Hashtag[];
}
