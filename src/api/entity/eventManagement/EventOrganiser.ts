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

  @CreateDateColumn({ type: 'text', nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'text', nullable: true })
  updatedAt?: Date;
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
}
