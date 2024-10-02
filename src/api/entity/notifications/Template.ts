import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { Notification } from './Notification';

@Entity({ name: 'Template' })
export class Template {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  templateAppTitle!: string;

  @Column({ type: 'text' })
  templatePhoneTitle!: string;

  @Column({ type: 'text' })
  templateAppContent!: string;

  @Column({ type: 'text' })
  templatePhoneContent!: string;

  @Column({ type: 'varchar' })
  templateName!: string;

  @Column({ type: 'varchar', nullable: true })
  providerTemplateId!: string;

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

  @OneToMany(() => Notification, notifications => notifications.notifications)
  template !: Template;
}
