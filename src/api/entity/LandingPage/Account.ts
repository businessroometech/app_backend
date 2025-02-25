import { randomBytes } from 'crypto';
import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: "Account" })
export class Account extends BaseEntity {

  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  emailAddress!: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  countryCode!: string;

  @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  role!: string;

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }
}
