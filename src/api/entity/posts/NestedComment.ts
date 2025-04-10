import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Mention } from './Mention';
// import { Hashtag } from '../Hashtag/Hashtag';

@Entity({ name: 'NestedComment' })
export class NestedComment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  postId!: string;

  @Column({ type: 'uuid' })
  commentId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string[];

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
  createdAt!: Date;

  @Column({ type: 'bool', default: false })
  isChild!: boolean;

  @Column({ type: 'uuid', nullable: true })
  repliedTo!: string;

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

  @OneToMany(() => Mention, (mention) => mention.nestedComment, { cascade: true })
  mentions!: Mention[];

  // @ManyToMany(() => Hashtag, (hashtag) => hashtag.nestedComments)
  // hashtag!: Hashtag[];
}
