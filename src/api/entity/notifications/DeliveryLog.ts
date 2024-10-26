import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { Notification } from './Notification';
import { randomBytes } from 'crypto';

@Entity({ name: 'deliveryLog' })
export class DeliveryLog {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'timestamp' })
    timestamp!: Date;

    @Column({ type: 'boolean' })
    delivered!: boolean;

    @Column({ type: 'uuid' })
    notificationId!: string;

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