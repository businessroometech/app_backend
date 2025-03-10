import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "AquiringStartup" })
export class AquiringStartup {

  @PrimaryGeneratedColumn("uuid")
  id !: string;

  @Column({ type: 'uuid' }) 
  userId !: string;

  @Column({ type: "bool", default: false })
  isHidden !: boolean;

  @Column({ type: "varchar", nullable: true })
  businessType?: string;

  @Column({ type: "varchar", nullable: true })
  location?: string;

  @Column({ type: "varchar", nullable: true })
  businessModel?: string;

  @Column({ type: "varchar", nullable: true })
  budget?: string;

  @Column({ type: "varchar", nullable: true })
  investment?: string;

  @Column({ type: "varchar", nullable: true })
  timeline?: string;

  @Column({ type: "varchar", nullable: true })
  interest?: string;

  @Column({ type: "varchar", nullable: true })
  support?: string;

  @Column({ type: "varchar", nullable: true })
  nda?: string;

  @Column({ type: "text", nullable: true })
  additionalInfo?: string;
}
