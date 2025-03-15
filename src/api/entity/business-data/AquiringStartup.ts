// import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// @Entity({ name: "AquiringStartup" })
// export class AquiringStartup {

//   @PrimaryGeneratedColumn("uuid")
//   id !: string; 

//   @Column({ type: 'uuid' }) 
//   userId !: string;

//   @Column({ type: "bool", default: false })
//   isHidden !: boolean;

//   @Column({ type: "varchar", nullable: true })
//   businessType?: string;

//   @Column({ type: "varchar", nullable: true })
//   location?: string;

//   @Column({ type: "varchar", nullable: true })
//   businessModel?: string;

//   @Column({ type: "varchar", nullable: true })
//   budget?: string;

//   @Column({ type: "varchar", nullable: true })
//   investment?: string;

//   @Column({ type: "varchar", nullable: true })
//   timeline?: string;

//   @Column({ type: "varchar", nullable: true })
//   interest?: string;

//   @Column({ type: "varchar", nullable: true })
//   support?: string;

//   @Column({ type: "varchar", nullable: true })
//   nda?: string;

//   @Column({ type: "text", nullable: true })
//   additionalInfo?: string;
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  BeforeInsert,
  BeforeUpdate
} from "typeorm";
import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  validateOrReject
} from "class-validator";

@Entity({ name: "AquiringStartup" })
export class AquiringStartup extends BaseEntity {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID("4", { message: "Invalid UUID format for userId" })
  userId!: string;

  @Column({ type: "bool", default: false })
  @IsBoolean({ message: "isHidden must be a boolean" })
  isHidden!: boolean;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "businessType must be a string" })
  @Length(3, 50, { message: "businessType must be between 3 and 50 characters" })
  businessType?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "location must be a string" })
  location?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "businessModel must be a string" })
  businessModel?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "budget must be a string" })
  budget?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "investment must be a string" })
  investment?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "timeline must be a string" })
  timeline?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "interest must be a string" })
  interest?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "support must be a string" })
  support?: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  @IsString({ message: "nda must be a string" })
  nda?: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  @IsString({ message: "additionalInfo must be a string" })
  additionalInfo?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async validateEntity() {
    await validateOrReject(this);
  }
}
