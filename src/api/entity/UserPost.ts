import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reaction } from './posts/Reaction';

@Entity({ name: 'UserPost' })
export class UserPost extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  Id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string;

  // @Column({ type: 'simple-array', nullable: true })
  // mentionId?: string[];

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

  @BeforeInsert()
  private async beforeInsert() {
    this.Id = this.generateUUID();
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }

   // One UserPost can have multiple reactions (One-to-Many)
   @OneToMany(() => Reaction, (reaction) => reaction.userPost, {
    cascade: true, 
  })
  reactions!: Reaction[];
}
