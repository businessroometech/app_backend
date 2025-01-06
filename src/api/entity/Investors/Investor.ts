/* eslint-disable prettier/prettier */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name : "Investor"})
export class Investor {

@PrimaryGeneratedColumn( "uuid")
Id! : string;

@Column({type: 'varchar', length: 200, nullable: true})
IntrestedStartups! : string

@Column({type: 'varchar', length: 200, nullable: true})
PreferredStageofStartups! : string

@Column({type: 'varchar', length: 200, nullable: true})
PreferedIndustry! : string

@Column({type: 'varchar', length: 200, nullable: true})
RegionOrCountrySpecific! : string

@Column({type: 'varchar', length: 200, nullable: true})
PreferdInvestmentSize! : number

@Column({type: 'varchar', length: 200, nullable: true})
TotalBudget! : string

@Column({type: 'varchar', length: 200, nullable: true})
CoinvestingIntrest! : string

@Column({type: 'varchar', length: 200, nullable: true})
EquityForInvestment! : string

@Column({type: 'varchar', length: 200, nullable: true})
PreferedInvestment! : string

@Column({type: 'varchar', length: 200, nullable: true})
ReturnExpectation! : string

@Column({type: 'varchar', length: 200, nullable: true})
InvolvmentLevel! : string

@Column({type: 'varchar', length: 200, nullable: true})
WaitForROI! : number

@Column({type: 'varchar', length: 200, nullable: true})
IntrestInProvidingSupport! : string

@Column({type: 'varchar', length: 200, nullable: true})
Experience! : number

@Column({type: 'varchar', length: 200, nullable: true})
PreviouslyInvestedStartups! : string


@Column({type: 'varchar', length: 200, nullable: true})
TotalStartupsInvestedIn! : string


@Column({type: 'varchar', length: 200, nullable: true})
NotableInvestment! : string

@Column({type: 'varchar', length: 200, nullable: true})
CriteriaForEvaluatingStartups! : string


@Column({type: 'varchar', length: 200, nullable: true})
PrferenceForStartupTeam! : string


@Column({type: 'varchar', length: 200, nullable: true})
RiskTolerance! : string


@Column({type: 'varchar', length: 200, nullable: true})
PreferStartupWithExitStratergy! : string



@Column({type: 'varchar', length: 200, nullable: true})
PreferenceInStartupStage! : string


@Column({type: 'varchar', length: 200, nullable: true})
PrimaryGoals! : string


@Column({type: 'varchar', length: 200, nullable: true})
GeographicOrMarketPreference! : string


@Column({type: 'varchar', length: 200, nullable: true})
ExpectedInvolvementAfterInvestment! : string


@Column({type: 'varchar', length: 200, nullable: true})
LiketoRecieveUpdates! : boolean





}
