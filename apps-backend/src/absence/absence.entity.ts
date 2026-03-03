import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbsenceType } from '../shared/absence-type.enum';
import { AbsenceStatus } from '../shared/absence-status.enum';
import { User } from '../users/user.entity';

@Entity('vacations') // Table name remains 'vacations'
export class Absence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.absences)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: AbsenceType,
  })
  type!: AbsenceType;

  @Column({
    type: 'enum',
    enum: AbsenceStatus,
    default: AbsenceStatus.PENDING,
  })
  status!: AbsenceStatus;

  @Column({ type: 'int', default: 0 })
  requestedDays!: number;

  @Column({ type: 'int', default: 0 })
  approvedDays!: number;

  @Column({ type: 'int', default: 0 })
  totalHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
