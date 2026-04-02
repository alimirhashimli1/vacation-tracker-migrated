import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { AbsenceService } from '../src/absence/absence.service';
import { AbsenceBalanceService } from '../src/absence/absence-balance.service';
import { AbsenceType } from '../src/shared/absence-type.enum';
import { AbsenceStatus } from '../src/shared/absence-status.enum';
import { createTestApp, setupTestDatabase, closeTestApp, truncateDatabase } from './test-utils';
import { CreateAbsenceDto } from '../src/shared/create-absence.dto';
import { UpdateAbsenceDto } from '../src/shared/update-absence.dto';

describe('Absence Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let usersService: UsersService;
  let absenceService: AbsenceService;
  let balanceService: AbsenceBalanceService;

  beforeAll(async () => {
    const result = await createTestApp();
    app = result.app;
    moduleFixture = result.moduleFixture;
    usersService = moduleFixture.get<UsersService>(UsersService);
    absenceService = moduleFixture.get<AbsenceService>(AbsenceService);
    balanceService = moduleFixture.get<AbsenceBalanceService>(AbsenceBalanceService);
    await setupTestDatabase(moduleFixture);
  });

  afterAll(async () => {
    await truncateDatabase(moduleFixture);
    await closeTestApp(app);
  });

  it('should decrease balance when a vacation is approved', async () => {
    // 1. Get the superadmin user
    const user = await usersService.findOneByEmail('alimirhashimli@gmail.com');
    expect(user).toBeDefined();

    // 2. Get initial balance
    const currentYear = new Date().getFullYear();
    const initialBalance = await balanceService.getRemainingVacationDays(user!.id, currentYear);
    
    // Default balance should be 30
    expect(initialBalance).toBe(30);

    // 3. Request a vacation (two weeks from now, Monday to Friday = 5 days)
    // We choose a date that is not a holiday.
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14); // Two weeks from now
    // Ensure it's a Monday
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Next Friday
    endDate.setHours(23, 59, 59, 999);

    const createDto: CreateAbsenceDto = {
      userId: user!.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: AbsenceType.VACATION,
      totalHours: 40,
      cost: 0,
    };

    const createdAbsence = await absenceService.create(createDto);
    expect(createdAbsence.status).toBe(AbsenceStatus.PENDING);
    expect(createdAbsence.requestedDays).toBe(5);

    // Balance should still be 30 because it's only PENDING
    const balanceAfterRequest = await balanceService.getRemainingVacationDays(user!.id, currentYear);
    expect(balanceAfterRequest).toBe(30);

    // 4. Approve the vacation
    const updateDto: UpdateAbsenceDto = {
      status: AbsenceStatus.APPROVED,
    };

    await absenceService.update(createdAbsence.id, updateDto);

    // 5. Verify balance decreased
    const finalBalance = await balanceService.getRemainingVacationDays(user!.id, currentYear);
    expect(finalBalance).toBe(initialBalance - 5);
    expect(finalBalance).toBe(25);
  });

  it('should NOT decrease balance for other types (e.g. Sick Leave)', async () => {
      const user = await usersService.findOneByEmail('alimirhashimli@gmail.com');
      expect(user).toBeDefined();
      
      const currentYear = new Date().getFullYear();
      
      const balanceBefore = await balanceService.getRemainingVacationDays(user!.id, currentYear);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14); // 2 weeks from now
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2); // 3 days
      
      const createDto: CreateAbsenceDto = {
          userId: user!.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: AbsenceType.SICK_LEAVE,
          totalHours: 24,
          cost: 0,
      };

      const createdAbsence = await absenceService.create(createDto);
      await absenceService.update(createdAbsence.id, { status: AbsenceStatus.APPROVED });

      const balanceAfter = await balanceService.getRemainingVacationDays(user!.id, currentYear);
      expect(balanceAfter).toBe(balanceBefore);
  });
});
