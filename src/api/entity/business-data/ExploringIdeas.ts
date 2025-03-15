import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: "ExploringIdeas" })
export class ExploringIdeas extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "uuid" })
    userId !: string;

    @Column({ type: "bool", default: false })
    isHidden !: boolean;

    @Column({ type: 'varchar', nullable: true })
    currentRole!: string;

    @Column({ type: 'varchar', nullable: true })
    companyName!: string;

    @Column({ type: 'simple-json', nullable: true })
    country!: { value: string; label: string } | null;

    @Column({ type: 'varchar', nullable: true })
    city!: string;

    @Column({ type: 'simple-json', nullable: true })
    businessType!: { value: string; label: string };

    @Column({ type: 'varchar', nullable: true })
    expertise!: string;

    @Column({ type: 'varchar', nullable: true })
    joiningReason!: string;

    @Column({ type: 'simple-json', nullable: true })
    contentToExplore!: { value: string; label: string }[];

    @Column({ type: 'simple-json', nullable: true })
    collaborationInterest!: { value: string; label: string };

    @Column({ type: 'simple-json', nullable: true })
    businessStage!: { value: string; label: string };

    @Column({ type: 'simple-json', nullable: true })
    businessPartnerships!: { value: string; label: string };

    @Column({ type: 'simple-json', nullable: true })
    priorExperience!: { value: string; label: string };

    @Column({ type: 'simple-json', nullable: true })
    primaryGoal!: { value: string; label: string }[];
}
