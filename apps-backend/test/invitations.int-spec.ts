import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { InvitationsService } from '../src/invitations/invitations.service';
import { MailService } from '../src/mail/mail.service';
import { Role } from '../src/shared/role.enum';
import { createTestApp, setupTestDatabase, closeTestApp, truncateDatabase } from './test-utils';
import { Repository } from 'typeorm';
import { Invitation } from '../src/invitations/invitations.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { SeederModule } from '../src/seeds/seeder.module';
import { ValidationPipe } from '@nestjs/common';

describe('Invitations Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let invitationsService: InvitationsService;
  let usersService: UsersService;
  let invitationRepo: Repository<Invitation>;
  let mailService: MailService;

  const mockMailService = {
    sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule,
        SeederModule,
      ],
    })
    .overrideProvider(MailService)
    .useValue(mockMailService)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    invitationsService = moduleFixture.get<InvitationsService>(InvitationsService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    invitationRepo = moduleFixture.get<Repository<Invitation>>(getRepositoryToken(Invitation));
    mailService = moduleFixture.get<MailService>(MailService);

    await setupTestDatabase(moduleFixture);
  });

  afterAll(async () => {
    await truncateDatabase(moduleFixture);
    await closeTestApp(app);
  });

  it('should store invitation in DB and trigger MailService', async () => {
    // 1. Get superadmin to be the inviter
    const superAdmin = await usersService.findOneByEmail('alimirhashimli@gmail.com');
    expect(superAdmin).toBeDefined();

    const inviteeEmail = 'newuser@example.com';
    const inviteeRole = Role.Employee;

    // 2. Create invitation
    const result = await invitationsService.createInvitation(inviteeEmail, inviteeRole, superAdmin!.id);

    // 3. Verify it's in the DB
    const storedInvitation = await invitationRepo.findOne({ where: { email: inviteeEmail } });
    expect(storedInvitation).toBeDefined();
    expect(storedInvitation!.role).toBe(inviteeRole);
    expect(storedInvitation!.invitedById).toBe(superAdmin!.id);
    expect(result.invitation.id).toBe(storedInvitation!.id);

    // 4. Verify MailService was called
    expect(mockMailService.sendInvitationEmail).toHaveBeenCalled();
    const callArgs = mockMailService.sendInvitationEmail.mock.calls[0];
    expect(callArgs[0]).toBe(inviteeEmail);
    expect(callArgs[1]).toContain('token=');
    expect(callArgs[1]).toContain(result.plainToken);
  });

  it('should throw ConflictException if user already exists', async () => {
      const superAdmin = await usersService.findOneByEmail('alimirhashimli@gmail.com');
      expect(superAdmin).toBeDefined();
      
      await expect(
          invitationsService.createInvitation(superAdmin!.email, Role.Employee, superAdmin!.id)
      ).rejects.toThrow('A user with this email already exists.');
  });
});
