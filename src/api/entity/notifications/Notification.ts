import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne } from 'typeorm';
import { Template } from './Template';

@Entity('Notification')
export class Notification {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  templateId!: string;

  @Column({ type: 'uuid' })
  recipientId!: string;

  @Column({ type: 'varchar' })
  recipientType!: string;

  @Column({ type: 'enum', enum: ['sms', 'email', 'inApp'] })
  notificationType !: string;

  @Column({ type: 'enum', enum: ['Pending', 'Sent', 'Failed'] })
  status!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'text', default: '' })
  content !: string;

  @Column({ type: 'json', nullable: true })
  data !: object;

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
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }

  @ManyToOne(() => Template, temp => temp.template)
  notifications !: Notification[];

}
