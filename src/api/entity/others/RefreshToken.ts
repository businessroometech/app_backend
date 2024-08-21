import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'RefreshToken' })
export class RefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // @Column({ type: 'varchar', length: 15, unique: true })
  // mobileNumber!: string;

  @Column({ type: "uuid" })
  userId !: string;

  @Column({ type: 'varchar' })
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'json' })
  revokedTokens: string[] = [];

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system', nullable: true })
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
  async beforeInsert() {
    this.id = this.generateUUID();
    this.token = await bcrypt.hash(this.token, 10);
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }
}
