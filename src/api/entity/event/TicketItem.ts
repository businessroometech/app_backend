import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

@Entity()
export class TicketItem {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsString({ message: 'Customer ID must be a string' })
  customerId: string;

  @Column()
  @IsNotEmpty({ message: 'Event ID is required' })
  @IsString({ message: 'Event ID must be a string' })
  eventId: string;

  @Column()
  @IsNotEmpty({ message: 'Ticket name is required' })
  @IsString({ message: 'Ticket name must be a string' })
  ticketName: string;

  @Column({ default: 'system' })
  @IsString({ message: 'Date must be a string' })
  date: EventDate;
  @Column()
  @IsNotEmpty({ message: 'Event start time is required' })
  @IsDateString({}, { message: 'Event start time must be a valid date string' })
  eventStartTime: string;

  @Column()
  @IsNotEmpty({ message: 'Event end time is required' })
  @IsDateString({}, { message: 'Event end time must be a valid date string' })
  eventEndTime: string;

  @Column()
  @IsNotEmpty({ message: 'Event location is required' })
  @IsString({ message: 'Event location must be a string' })
  eventLocation: string;

  @Column({ default: 'system' })
  @IsOptional()
  @IsString({ message: 'Updated by must be a string' })
  updatedBy: string;

  @Column({ default: 'draft' })
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
