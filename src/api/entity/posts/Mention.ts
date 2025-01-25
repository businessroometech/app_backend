import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';
import { UserPost } from '../UserPost';

@Entity({ name: 'Mention' })
export class Mention extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToMany(() => PersonalDetails, (user) => user.mentions)
  @JoinTable({
    name: 'mention_user',
    joinColumn: { name: 'mentionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users!: PersonalDetails[];

  @ManyToMany(() => UserPost, (post) => post.mentions)
  @JoinTable({
    name: 'mention_post',
    joinColumn: { name: 'mentionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'postId', referencedColumnName: 'id' },
  })
  posts!: UserPost[];

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
