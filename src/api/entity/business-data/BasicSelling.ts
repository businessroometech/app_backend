import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity({ name: "BasicSelling" })
export class BasicSelling extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'uuid' })
    userId !: string;

    @Column({ type: "bool", default: false })
    isHidden !: boolean;

    @Column({ type: "varchar", nullable: true })
    businessType!: string;

    @Column({ type: "varchar", nullable: true })
    country!: string;

    @Column({ type: "varchar", nullable: true })
    city!: string;

    @Column({ type: "varchar", nullable: true })
    businessModel!: string;

    @Column({ type: "varchar", nullable: true })
    expectedSellingPrice!: string;

    @Column({ type: "varchar", nullable: true })
    requiresRenovation!: string;

    @Column({ type: "varchar", nullable: true })
    sellingTimeline!: string;

    @Column({ type: "varchar", nullable: true })
    supportAfterSale!: string;

    @Column({ type: "varchar", nullable: true })
    ndaAgreement!: string;

    @Column({ type: "text", nullable: true })
    additionalInformation?: string;
}
