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

@Entity({ name: 'EducationalDetailsPetcare' })
export class EducationalDetailsPetcare extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: "uuid" })
  userId !: string;

  @Column({ type: 'int' })
  yearsOfExperience!: number;

  @Column({ type: 'text', nullable: true })
  typeOfExperience!: string;

  @Column({ type: 'text', nullable: true })
  certificateAndLicence!: string;

  @Column({ type: 'text', nullable: true })
  insurance!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workingDays!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workingHours!: string;

  @Column({ type: 'text', nullable: true })
  petsYouAreComfortableWith!: string;

  @Column({ type: 'text', nullable: true })
  breedExperience!: string;

  @Column({ type: 'text', nullable: true })
  petSize!: string;

  @Column({ type: 'text', nullable: true })
  ratesOfEachService!: string;

  @Column({ type: 'text', nullable: true })
  serviceArea!: string;

  @Column({ type: 'text', nullable: true })
  previousWork!: string;

  @Column({ type: 'text', nullable: true })
  anyDocuments!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shortIntroVideo!: string;

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
