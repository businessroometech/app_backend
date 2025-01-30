import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BaseEntity,
} from 'typeorm';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

@Entity({ name: "Message" })
export class Message extends BaseEntity{
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  senderId!: string;

  @Column({ type: 'uuid' })
  receiverId!: string;

  @Column({ type: 'text' })
  content!: string; // Encrypted content will be stored here

  @Column({ type: 'simple-array' })
  documentKeys!: string[];

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', default: 'system' })
  createdBy!: string;

  @Column({ type: 'varchar', default: 'system' })
  updatedBy?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt!: Date;

  // Static encryption configuration
  private static encryptionKey = Buffer.from(
    process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
    'hex'
  ); // Replace with a securely stored key (256 bits)
  private static ivLength = 16;

  private static encrypt(text: string): string {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) {
      throw new Error("Invalid encrypted text format.");
    }
  
    const [ivHex, encryptedData] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
  
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // @BeforeInsert()
  // private encryptContentOnInsert() {
  //   if (this.content) {
  //     this.content = Message.encrypt(this.content);
  //   }
  // }

  public decryptMessage(): string {
    return Message.decrypt(this.content);
  }
}
