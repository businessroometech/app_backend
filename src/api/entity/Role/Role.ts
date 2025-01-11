import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// import { PersonalDetails } from '../personal/PersonalDetails'; 

@Entity({ name: 'Role' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  Investor!: string;

  @Column({ type: 'varchar', length: 50 })
  BusinessSeller!: string;

  @Column({ type: 'varchar', length: 50 })
  Entrepreneur!: string;

  @Column({ type: 'varchar', length: 50 })
  BusinessBuyer!: string;

  // @OneToMany(() => PersonalDetails, (personalDetails) => personalDetails.role)
  // personalDetails!: PersonalDetails[];
}
