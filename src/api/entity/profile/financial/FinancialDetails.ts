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

@Entity({ name: 'FinancialDetails' })
export class FinancialDetails extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    sectorId!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'varchar', length: 255 })
    bankName!: string;

    @Column({ type: 'varchar', length: 255 })
    ifscCode!: string;

    @Column({ type: 'simple-array' })
    upiIds!: string[];

    @Column({ type: 'simple-array' })
    cancelledChequeUploadIds!: string[];

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

    private generateUUID() {
        return randomBytes(16).toString('hex');
    }
}
