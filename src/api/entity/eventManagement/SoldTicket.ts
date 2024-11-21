import { randomBytes } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToOne, JoinColumn } from 'typeorm';
import { Ticket } from './Ticket';
import { UserLogin } from '../user/UserLogin';

@Entity({ name: 'SoldTicket' })
export class SoldTicket extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'float', nullable: true })
  totalQuantity?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice?: number;

  @Column({ type: 'uuid' })
  ticketId!:string

  @Column({type: 'varchar', precision: 10, scale: 2, nullable: true })
  transisterID?: string;

  @Column({ type: 'uuid' })
  boughtById!:string

   @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;

  @BeforeInsert()
  generateTransisterID() {
    this.transisterID = randomBytes(8).toString('hex');
  }

  @OneToOne(() => Ticket, (ticket)=>ticket.soldTicket)
  ticket!: Ticket;

  @ManyToOne(() => UserLogin, (userLogin) => userLogin.soldTickets)
  boughtBy?: UserLogin;
}
