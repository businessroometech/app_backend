import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  JoinColumn,
  Entity,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Mention } from './Mention';
// import { Hashtag } from '../Hashtag/Hashtag';
import { PersonalDetails } from '../personal/PersonalDetails';

@Entity({ name: 'Comment' })
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => PersonalDetails, (user) => user.commentRef, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userRef' })
  userRef!: PersonalDetails;

  @Column({ type: 'uuid' })
  postId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string[];

  @Column({ type: 'json', nullable: true })
  mediaKeys?: { key: string; type: string };

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

  @OneToMany(() => Mention, (mention) => mention.comment, { cascade: true })
  mentions!: Mention[];

  // @ManyToMany(() => Hashtag, (hashtag) => hashtag.comments)
  // hashtag!: Hashtag[];
}
