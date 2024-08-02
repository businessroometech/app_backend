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

interface ServiceOffered {
    sector: string;
    category: string;
    type: 'primary' | 'secondary';
    name: string;
    description: string;
    price: string;
    per: string;
}

@Entity({ name: 'UserSectorRole' })
export class UserSectorRole extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 15, unique: true })
    mobileNumber!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'simple-json' })
    sectorsAssociated!: string[];

    @Column({ type: 'simple-json' })
    categoriesAssociated!: string[];

    @Column({ type: 'simple-json' })
    servicesOffered!: ServiceOffered[];

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
