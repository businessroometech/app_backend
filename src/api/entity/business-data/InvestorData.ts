// import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

// @Entity({ name: "InvestorData" })
// export class InvestorData extends BaseEntity {
//     @PrimaryGeneratedColumn('uuid') 
//     id !: string;

//     @Column({ type: 'uuid' }) 
//     userId !: string;

//     @Column({ type: "bool", default: false })
//     isHidden !: boolean;

//     @Column({ type: 'varchar', nullable: true }) 
//     isAccredited !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     accreditationGroups?: string;

//     @Column({ type: 'varchar', nullable: true  })
//     investorProfile !: string;

//     @Column('simple-array',{ nullable: true } ) 
//     startupTypes !: string[];

//     @Column({ type: 'varchar', nullable: true  }) 
//     investmentStage !: string;

//     @Column({ type: 'varchar', nullable: true  })
//     specificRegion !: string;

//     @Column({ type: 'varchar', nullable: true  })
//     regionPreference !: string;

//     @Column({ type: 'varchar', nullable: true  })
//     investmentSize !: string;

//     @Column({ type: 'varchar', nullable: true  })
//     totalBudget !: string;

//     @Column({ type: 'varchar', nullable: true  }) 
//     coInvestment !: string;

//     @Column({ type: 'varchar', nullable: true  }) 
//     equityPercentage !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     investmentType !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     involvementLevel !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     additionalSupport !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     previousInvestment !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     investmentExperience !: string;

//     @Column({ type: 'varchar', nullable: true })
//     numberOfStartups !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     notableSuccess !: string;

//     @Column({ type: 'varchar', nullable: true }) 
//     successDetails !: string;

//     @Column({ type: 'varchar', nullable: true })
//     decisionMakingProcess !: string;

//     @Column({ type: 'varchar', nullable: true })
//     exitStrategy !: string;

//     @Column({ type: 'varchar', nullable: true })
//     expectedInvolvement !: string;

//     @Column('simple-array', { nullable: true })
//     keyCriteria !: string[];

//     @Column({ type: 'varchar', nullable: true })
//     fundraisingStage !: string;
// }

import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IsUUID, IsBoolean, IsOptional, IsString, IsArray, IsNumber, Min, Max, validateOrReject } from 'class-validator';

@Entity({ name: "InvestorData" })
export class InvestorData extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    @IsUUID()
    userId!: string;

    @Column({ type: "bool", default: false })
    @IsBoolean()
    isHidden!: boolean;

    @Column({ type: 'bool', default: false })
    @IsBoolean()
    isAccredited!: boolean;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    accreditationGroups?: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investorProfile!: string;

    @Column('simple-array', { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    startupTypes!: string[];

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investmentStage!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    specificRegion!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    regionPreference!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investmentSize!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    totalBudget!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    coInvestment!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    equityPercentage!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investmentType!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    involvementLevel!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    additionalSupport!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    previousInvestment!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    investmentExperience!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    numberOfStartups!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    notableSuccess!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    successDetails!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    decisionMakingProcess!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    exitStrategy!: string;

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    expectedInvolvement!: string;

    @Column('simple-array', { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keyCriteria!: string[];

    @Column({ type: 'varchar', nullable: true })
    @IsOptional()
    @IsString()
    fundraisingStage!: string;

    // Validate entity before insert or update
    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        await validateOrReject(this);
    }
}
