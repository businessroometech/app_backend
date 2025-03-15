import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity({ name: "InvestorData" })
export class InvestorData extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') 
    id !: string;

    @Column({ type: 'uuid' }) 
    userId !: string;

    @Column({ type: "bool", default: false })
    isHidden !: boolean;

    @Column({ type: 'varchar', nullable: true }) 
    isAccredited !: string;

    @Column({ type: 'varchar', nullable: true }) 
    accreditationGroups?: string;

    @Column({ type: 'varchar', nullable: true  })
    investorProfile !: string;

    @Column('simple-array',{ nullable: true } ) 
    startupTypes !: string[];

    @Column({ type: 'varchar', nullable: true  }) 
    investmentStage !: string;

    @Column({ type: 'varchar', nullable: true  })
    specificRegion !: string;

    @Column({ type: 'varchar', nullable: true  })
    regionPreference !: string;

    @Column({ type: 'varchar', nullable: true  })
    investmentSize !: string;

    @Column({ type: 'varchar', nullable: true  })
    totalBudget !: string;

    @Column({ type: 'varchar', nullable: true  }) 
    coInvestment !: string;

    @Column({ type: 'varchar', nullable: true  }) 
    equityPercentage !: string;

    @Column({ type: 'varchar', nullable: true }) 
    investmentType !: string;

    @Column({ type: 'varchar', nullable: true }) 
    involvementLevel !: string;

    @Column({ type: 'varchar', nullable: true }) 
    additionalSupport !: string;

    @Column({ type: 'varchar', nullable: true }) 
    previousInvestment !: string;

    @Column({ type: 'varchar', nullable: true }) 
    investmentExperience !: string;

    @Column({ type: 'varchar', nullable: true })
    numberOfStartups !: string;

    @Column({ type: 'varchar', nullable: true }) 
    notableSuccess !: string;

    @Column({ type: 'varchar', nullable: true }) 
    successDetails !: string;

    @Column({ type: 'varchar', nullable: true })
    decisionMakingProcess !: string;

    @Column({ type: 'varchar', nullable: true })
    exitStrategy !: string;

    @Column({ type: 'varchar', nullable: true })
    expectedInvolvement !: string;

    @Column('simple-array', { nullable: true })
    keyCriteria !: string[];

    @Column({ type: 'varchar', nullable: true })
    fundraisingStage !: string;
}
