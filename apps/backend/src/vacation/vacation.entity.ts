import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VacationType } from '../../../../shared/create-vacation.dto';

@Entity('vacations')
export class Vacation {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @Column()
  startDate!: Date; // Store as Date object

  @Column()
  endDate!: Date; // Store as Date object

  @Column({
    type: 'enum',
    enum: VacationType,
  })
  type!: VacationType;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
