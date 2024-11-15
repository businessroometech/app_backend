import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  JoinColumn,
} from 'typeorm';
import { Event } from './Event';
import { randomBytes } from 'crypto';

@Entity({ name: 'EventOrganiser' })
export class EventOrganiser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'text', nullable: true })
  imgurl?: string;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'char', nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @OneToMany(() => SocialMediaLink, (socialMedia) => socialMedia.organiser, { cascade: true })
  socialmedia?: SocialMediaLink[];
  
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
}

@Entity({ name: 'SocialMediaLink' })
export class SocialMediaLink extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'text', nullable: true })
  platform?: string;

  @Column({ type: 'text', nullable: true })
  link?: string;

  @ManyToOne(() => EventOrganiser, (organiser) => organiser.socialmedia)
  @JoinColumn({ name: 'organiserId' })
  organiser?: EventOrganiser;

  @ManyToOne(() => Event, (event) => event.organiser)
  event?: Event;
  
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
}
