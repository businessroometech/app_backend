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
import { EventDraft } from './EventDraft';

@Entity({ name: 'EventOrganiser' })
export class EventOrganiser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  // @Column({ type: 'uuid', nullable: true  })
  // eventDraftId!: string;

  @Column({ type: 'uuid', nullable: true  })
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
  socialMediaLinks!: SocialMediaLink[];
  
  // @ManyToOne(() => EventDraft, (eventDraft) => eventDraft.organisers)
  // @JoinColumn({ name: 'eventDraftId' }) 
  // eventDraft!: EventDraft;

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

  @ManyToOne(() => EventOrganiser, (organiser) => organiser.socialMediaLinks)
  @JoinColumn({ name: 'organiserId' }) 
  organiser!: EventOrganiser;

  // @ManyToOne(() => Event, (event) => event.organiser)
  // event?: Event;

  // @ManyToOne(() => Event, (event) => event.organiser)
  // eventDraft?: EventDraft;
  
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
