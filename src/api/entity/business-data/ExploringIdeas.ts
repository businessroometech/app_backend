// import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

// @Entity({ name: "ExploringIdeas" })
// export class ExploringIdeas extends BaseEntity {
//     @PrimaryGeneratedColumn('uuid')
//     id!: string;

//     @Column({ type: "uuid" })
//     userId !: string;

//     @Column({ type: "bool", default: false })
//     isHidden !: boolean;

//     @Column({ type: 'varchar', nullable: true })
//     currentRole!: string;

//     @Column({ type: 'varchar', nullable: true })
//     companyName!: string;

//     @Column({ type: 'simple-json', nullable: true })
//     country!: { value: string; label: string } | null;

//     @Column({ type: 'varchar', nullable: true })
//     city!: string;

//     @Column({ type: 'simple-json', nullable: true })
//     businessType!: { value: string; label: string };

//     @Column({ type: 'varchar', nullable: true })
//     expertise!: string;

//     @Column({ type: 'varchar', nullable: true })
//     joiningReason!: string;

//     @Column({ type: 'simple-json', nullable: true })
//     contentToExplore!: { value: string; label: string }[];

//     @Column({ type: 'simple-json', nullable: true })
//     collaborationInterest!: { value: string; label: string };

//     @Column({ type: 'simple-json', nullable: true })
//     businessStage!: { value: string; label: string };

//     @Column({ type: 'simple-json', nullable: true })
//     businessPartnerships!: { value: string; label: string };

//     @Column({ type: 'simple-json', nullable: true })
//     priorExperience!: { value: string; label: string };

//     @Column({ type: 'simple-json', nullable: true })
//     primaryGoal!: { value: string; label: string }[];
// }

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import {
    IsUUID,
    IsBoolean,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
    ArrayMinSize,
    ArrayMaxSize,
    IsObject,
    IsArray,
    validateOrReject
} from 'class-validator';
import { Type } from 'class-transformer';

class LabelValue {
    @IsString({ message: "Value must be a string" })
    value!: string;

    @IsString({ message: "Label must be a string" })
    label!: string;
}

@Entity({ name: "ExploringIdeas" })
export class ExploringIdeas extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "uuid" })
    @IsUUID("4", { message: "Invalid UUID format for userId" })
    userId!: string;

    @Column({ type: "bool", default: false })
    @IsBoolean({ message: "isHidden must be a boolean" })
    isHidden!: boolean;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString({ message: "currentRole must be a string" })
    currentRole!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString({ message: "companyName must be a string" })
    companyName!: string;

    @Column({ type: 'simple-json', nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => LabelValue)
    @IsObject({ message: "country must be an object with value and label" })
    country!: LabelValue | null;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString({ message: "city must be a string" })
    city!: string;

    @Column({ type: 'simple-json', nullable: true })
    @ValidateNested()
    @Type(() => LabelValue)
    @IsObject({ message: "businessType must be an object with value and label" })
    businessType!: LabelValue;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString({ message: "expertise must be a string" })
    expertise!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString({ message: "joiningReason must be a string" })
    joiningReason!: string;

    @Column({ type: 'simple-json', nullable: true })
    @IsOptional()
    @IsArray({ message: "contentToExplore must be an array" })
    @ValidateNested({ each: true })
    @Type(() => LabelValue)
    @ArrayMinSize(1, { message: "contentToExplore must have at least one item" })
    contentToExplore!: LabelValue[];

    @Column({ type: 'simple-json', nullable: true })
    @ValidateNested()
    @Type(() => LabelValue)
    @IsObject({ message: "collaborationInterest must be an object with value and label" })
    collaborationInterest!: LabelValue;

    @Column({ type: 'simple-json', nullable: true })
    @ValidateNested()
    @Type(() => LabelValue)
    @IsObject({ message: "businessStage must be an object with value and label" })
    businessStage!: LabelValue;

    @Column({ type: 'simple-json', nullable: true })
    @ValidateNested()
    @Type(() => LabelValue)
    @IsObject({ message: "businessPartnerships must be an object with value and label" })
    businessPartnerships!: LabelValue;

    @Column({ type: 'simple-json', nullable: true })
    @ValidateNested()
    @Type(() => LabelValue)
    @IsObject({ message: "priorExperience must be an object with value and label" })
    priorExperience!: LabelValue;

    @Column({ type: 'simple-json', nullable: true })
    @IsArray({ message: "primaryGoal must be an array" })
    @ValidateNested({ each: true })
    @Type(() => LabelValue)
    @ArrayMinSize(1, { message: "primaryGoal must have at least one item" })
    primaryGoal!: LabelValue[];

    // 🔹 Automatically validate before inserting or updating
    @BeforeInsert()
    @BeforeUpdate()
    async validateEntity() {
        await validateOrReject(this);
    }
}
