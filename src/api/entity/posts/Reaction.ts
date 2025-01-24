import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PersonalDetails } from '../personal/PersonalDetails';
import { UserPost } from '../UserPost';

export enum ReactionType {
  LIKE = 'Like',
  LOVE = 'Love',
  CELEBRATE = 'Celebrate',
  INSIGHTFUL = 'Insightful',
  FUNNY = 'Funny',
}

@Entity({ name: 'Reaction' })
export class Reaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relation with PersonalDetails (User)
  @ManyToOne(() => PersonalDetails, (personalDetails) => personalDetails.reactions, {
    onDelete: 'CASCADE',
    eager: true,
  })
  user!: PersonalDetails;

  @ManyToOne(() => UserPost, (userPost) => userPost.reactions, {
    onDelete: 'CASCADE',
    eager: false, 
  })
  post!: UserPost;

  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LOVE,
  })
  reactionType!: ReactionType;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy!: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  updatedAt!: Date;

  @BeforeInsert()
  async generateUUIDBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
