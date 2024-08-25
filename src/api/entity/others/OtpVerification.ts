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

@Entity({ name: 'OtpVerification' })
export class OtpVerification extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "uuid" })
    userId !: string;

    @Column({ type: 'varchar' })
    verificationCode!: string;

    @Column({ type: 'boolean', default: false })
    isVerified!: boolean;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;

    @Column({ type: "enum", enum: ['Customer', 'Service Provider'] })
    userType !: string;

    @Column({ type: "enum", enum: ['Mobile', 'Email'] })
    sentTo !: string;

    @Column({ type: "enum", enum: ['Signup', 'Forgot Password', 'Started Work', 'Ended Work'] })
    case !: string;

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
