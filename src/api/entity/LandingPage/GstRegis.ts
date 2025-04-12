import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
    BaseEntity,
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'GstRegistrations' })
export class GstRegistrations extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'varchar', nullable: true })
    userType!: string;

    @Column({ type: 'varchar', nullable: true })
    state!: string;

    @Column({ type: 'varchar', nullable: true })
    district!: string;

    @Column({ type: 'varchar', nullable: true })
    businessName!: string;

    @Column({ type: 'varchar', nullable: true })
    pan!: string;

    @Column({ type: 'varchar', nullable: true })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    mobileNumber!: string;

    @Column({ type: 'json', nullable: true })
    businessDetails!: {
        tradeName: string;
        constitutionOfBusiness: string;
        reasonForRegistration: string;
        commencementDate: string;
        liabilityDate: string;
        isCasualTaxablePerson: boolean;
        isCompositionOption: boolean;
        registrations: Array<{ type: string; number: string; date: string }>;
        document: string | null;
    };

    @Column({ type: 'json', nullable: true })
    promoter!: Array<{
        firstName: string;
        middleName: string;
        lastName: string;
        fathersFirstName: string;
        fathersMiddleName: string;
        fathersLastName: string;
        dateOfBirth: string;
        mobileNumber: string;
        email: string;
        gender: string;
        telephoneNumber: string;
        designation: string;
        directorIdentificationNumber: string;
        isIndianCitizen: boolean;
        pan: string;
        passportNumber: string;
        aadhaarNumber: string;
        pinCode: string;
        state: string;
        district: string;
        city: string;
        locality: string;
        road: string;
        premisesName: string;
        buildingNumber: string;
        floorNumber: string;
        landmark: string;
        latitude: string;
        longitude: string;
        photograph: string | null;
        isAuthorizedSignatory: boolean;
    }>;

    @Column({ type: 'json', nullable: true })
    authorizedSignatory!: Array<{
        firstName: string;
        middleName: string;
        lastName: string;
        fathersFirstName: string;
        fathersMiddleName: string;
        fathersLastName: string;
        dateOfBirth: string;
        mobileNumber: string;
        email: string;
        gender: string;
        telephoneNumber: string;
        designation: string;
        directorIdentificationNumber: string;
        isIndianCitizen: boolean;
        pan: string;
        passportNumber: string;
        aadhaarNumber: string;
        pinCode: string;
        state: string;
        district: string;
        city: string;
        locality: string;
        road: string;
        premisesName: string;
        buildingNumber: string;
        floorNumber: string;
        landmark: string;
        latitude: string;
        longitude: string;
        photograph: string | null;
        proof: string | null;
        isPrimaryAuthorizedSignatory: boolean;
    }>;

    @Column({ type: 'json', nullable: true })
    authorizedRepresentative!: {
        type: string;
        enrollmentId: string;
        firstName: string;
        middleName: string;
        lastName: string;
        designation: string;
        mobileNumber: string;
        email: string;
        pan: string;
        aadhaar: string;
        telephone: string;
        fax: string;
    };

    @Column({ type: 'json', nullable: true })
    place!: {
        pinCode: string;
        state: string;
        district: string;
        city: string;
        locality: string;
        road: string;
        premises: string;
        buildingNo: string;
        floorNo: string;
        landmark: string;
        latitude: string;
        longitude: string;
        stateJurisdiction: string;
        sector: string;
        commissioner: string;
        division: string;
        range: string;
        officeEmail: string;
        officeTelephone: string;
        mobileNumber: string;
        officeFax: string;
        natureOfPossession: string;
        documentProof: string;
        businessNature: string[];
        otherBusinessNature: string;
        uploadedFile: string | null;
    };

    @Column({ type: 'json', nullable: true })
    additionalPlaces!: Array<{
        pinCode: string;
        state: string;
        district: string;
        city: string;
        locality: string;
        road: string;
        premises: string;
        buildingNo: string;
        floorNo: string;
        landmark: string;
        latitude: string;
        longitude: string;
        stateJurisdiction: string;
        sector: string;
        commissioner: string;
        division: string;
        range: string;
        officeEmail: string;
        officeTelephone: string;
        mobileNumber: string;
        officeFax: string;
        natureOfPossession: string;
        documentProof: string;
        businessNature: string[];
        otherBusinessNature: string;
        uploadedFile: string | null;
    }>;

    @Column({ type: 'json', nullable: true })
    goods!: Array<{ id: string; hsnCode: string; description: string }>;

    @Column({ type: 'json', nullable: true })
    services!: Array<{ id: string; hsnCode: string; description: string }>;

    @Column({ type: 'json', nullable: true })
    stateSpecificInfo!: {
        taxECNo: string;
        taxRegisCertNo: string;
        exciseLicenseNo: string;
        licenseHolderName: string;
    };

    @Column({ type: 'boolean', nullable: true })
    isAdhaarAuth!: boolean;

    @Column({ type: 'json', nullable: true })
    verification !: {
        signatory: string,
        place: string,
        designation: string,
        agreed: boolean,
    }

    @Column({ type: 'varchar', nullable: true })
    gstIn !: boolean;

    @Column({ type: 'varchar', default: 'system' })
    createdBy!: string;

    @Column({ type: 'varchar', default: 'system' })
    updatedBy!: string;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        precision: 6,
    })
    createdAt!: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
        precision: 6,
    })
    updatedAt!: Date;
}