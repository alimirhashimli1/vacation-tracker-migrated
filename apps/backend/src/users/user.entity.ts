import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Role } from '../../../../shared/role.enum';
import { Absence } from '../absence/absence.entity';
import { Invitation } from '../invitations/invitations.entity'; // Import Invitation entity

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  password?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Employee,
  })
  role!: Role;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 'DE' })
  region!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Absence, (absence) => absence.user)
  absences!: Absence[];

  @OneToMany(() => Invitation, (invitation) => invitation.invitedBy)
  invitations!: Invitation[];
}
