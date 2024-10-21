import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';

@Entity({ name: "BankDetails" })
export class BankDetails extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'varchar', length: 255 })
    bankName!: string;

    @Column({ type: 'varchar', length: 255 })
    accountHolderName!: string;

    @Column({ type: 'varchar', length: 255 })
    accountNumber!: string;

    @Column({ type: 'varchar', length: 50 })
    ifscCode!: string;
}
