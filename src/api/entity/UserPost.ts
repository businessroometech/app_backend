import { randomBytes } from 'crypto';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity({ name: 'UserPost' }) 
export class UserPost extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  Id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 , nullable: true})
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', nullable: true }) 
  hashtags?: string;

  @Column({ type: 'simple-array', nullable: true }) 
  mentionId?: string[];

  @Column({ type: 'simple-array', nullable: true }) 
  mediaIds?: string[];

  @Column({ type: 'simple-array', nullable: true }) 
  likeIds?: number[];

  @Column({ type: 'simple-array', nullable: true })
  commentIds?: number[];

  @Column({ type: 'simple-array', nullable: true })
  shareIds?: number[];

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
}
