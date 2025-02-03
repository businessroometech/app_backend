/* eslint-disable prettier/prettier */

import { randomBytes } from 'crypto';
import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'SubRole' })
export class SubRole extends BaseEntity {

  @PrimaryColumn('uuid')
  id!: string;

    @Column({ type: 'varchar', length: 100})
    UserId!: string;


    @Column({type:'varchar' , length:"100"})
    SubRole! : string 
     
    

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    this.id = this.generateUUID();
  }

  private generateUUID() {
    return randomBytes(16).toString('hex');
  }

}
