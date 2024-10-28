import { randomBytes } from 'crypto';
import {
    BaseEntity,
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserLogin } from './UserLogin';

@Entity({ name: 'PrimaryRoleMapping' })
export class PrimaryRoleMapping extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId !: string;

    @Column({ type: 'varchar', length: 15 })
    mobileNumber!: string;

    @Column({ type: 'enum', enum: ['Customer', 'ServiceProvider'] })
    primaryRole !: 'Customer' | 'ServiceProvider';

    @Column({ type: 'varchar', default: 'system' })
    createdBy!: string;

    @Column({ type: 'varchar', default: 'system' })
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
    async hashPasswordBeforeInsert() {
        this.id = this.generateUUID();
    }

    private generateUUID() {
        return randomBytes(16).toString('hex');
    }

    @ManyToOne(() => UserLogin, user => user.primaryRoles)
    user !: UserLogin;

}
