import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, BeforeInsert, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { UserAddress } from '../user/UserAddress';
import { Sector } from '../sector/Sector';
import { randomBytes } from 'crypto';

@Entity({ name: "EventItem" })
export class EventItem extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Sector)
  @JoinColumn({ name: 'sectorId' })
  sector!: Sector;

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

  @Column({ type: 'varchar', default: 'party' })
  eventType!: string;

  @Column({ type: 'varchar', default: 'birthday party' })
  eventName!: string;

  @Column({ type: 'varchar', default: '' })
  description!: string;

  @Column({ type: 'varchar', default: 'Gyan Tiwari' })
  hostName!: string;

  @Column({ type: 'int', default: 1 })
  partyLimit!: number;

  @Column({ type: 'boolean', default: true })
  private!: boolean;

  @Column({ type: 'varchar', default: 'system' })
  eventsImg!: string;

  @Column({ type: 'date' })
  eventDate!: Date;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column(() => UserAddress)
  address!: UserAddress;

  @Column({ type: 'uuid' })
  scheduleId!: string;

  @Column({ type: 'varchar' })
  scheduleTitle!: string;

  @Column({ type: 'time' })
  scheduleTime!: string;

  @Column({ type: 'uuid' })
  dressCodeId!: string;

  @Column({ type: 'boolean', default: false })
  ticketPrice!: boolean;

  @Column({ type: 'varchar', nullable: true })
  ticketPriceType?: string;

  @Column({ type: 'int', nullable: true })
  ticketPriceTotalTickets?: number;

  @Column({ type: 'decimal', nullable: true })
  ticketPriceAmount?: number;

  @Column({ type: 'text', nullable: true })
  ticketPriceThings?: string;

  @Column({ type: 'varchar' })
  RSVP!: string;

  @Column({ type: 'date' })
  RSVPDeadlineDate!: Date;

  @Column({ type: 'time' })
  RSVPDeadlineTime!: string;

  @Column('jsonb')
  organiserDetails!: {
    img: string,
    name: string,
    phone: string,
    email: string,
    socialMedia: { name: string, link: string }[]
  };

  @Column({ type: 'varchar', default: 'free' })
  eventEntryType!: 'free' | 'charges';

  @Column({ type: 'jsonb', nullable: true })
  eventEntryCharges?: {
    eventEntryTypeId: string,
    eventChargesType: { couple: number, single: number }
  };

  @Column({ type: 'boolean', default: false })
  eventInclusions!: boolean;

  @Column({ type: 'boolean', default: false })
  ageRestrictions!: boolean;

  @Column({ type: 'text', nullable: true })
  otherRestrictions?: string;

  @Column({ type: 'varchar', default: 'physical' })
  eventCategory!: 'physical' | 'virtual';

  @Column({ type: 'varchar', default: 'withoutTicket' })
  eventSubCategory!: 'withoutTicket' | 'withTicket';

  @BeforeInsert()
  async beforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID(): string {
    return randomBytes(16).toString('hex');
  }
}
