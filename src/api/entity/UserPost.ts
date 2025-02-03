import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reaction } from './posts/Reaction';
import { Mention } from './posts/Mention';

@Entity({ name: 'UserPost' })
export class UserPost extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string[];

  @Column({ type: 'simple-array', nullable: true })
  mediaKeys?: string[];

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

  @Column({ type: "boolean", default: false })
  isRepost !: boolean;

  @Column({ type: "uuid", default: null })
  repostedFrom !: string;

  @Column({ type: "text" , default: null})
  repostText !: string;

  @BeforeInsert()
  private async beforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }

  @OneToMany(() => Reaction, (reaction) => reaction.post, {
    cascade: true,
  })
  reactions!: Reaction[];

  @OneToMany(() => Mention, (mention) => mention.post, {
    cascade: true, 
  })
  mentions!: Mention[];
  
}
