import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../../../../shared/role.enum';
import { InvitationStatus } from '../../../../shared/invitation-status.enum';
import { User } from '../users/user.entity'; // Import User entity

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role!: Role;

  @Column() // Stores hashed token

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  usedAt?: Date; // New field for when the invitation was used

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @Column()
  invitedById!: string; // Foreign key for the inviting user

  @ManyToOne(() => User) // Define the ManyToOne relationship with User
  @JoinColumn({ name: 'invitedById' }) // Specify the foreign key column
  invitedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
