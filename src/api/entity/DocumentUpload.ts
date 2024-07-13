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

export enum DocumentType {
    PROFILE = 'Profile',
    PORTFOLIO = 'Portfolio',
    BILL = 'Bill',
    AADHAR = 'Aadhar',
    PAN = 'Pan',
    OTHER = 'Other',
}

@Entity('DocumentUpload')
export class DocumentUpload extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    bucketName!: string;

    @Column({ type: 'varchar', length: 255 })
    key!: string;

    @Column({ type: 'varchar', length: 255 })
    contentType!: string;

    // @Column({ type: 'varchar', length: 255, nullable: true })
    // documentName?: string;

    @Column({
        type: 'enum',
        enum: DocumentType,
        nullable: true,
    })
    documentType?: DocumentType;

    @Column({ type: 'text', nullable: true })
    documentDescription?: string;

    @Column({ type: 'bigint', nullable: true })
    documentSize?: number;

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
