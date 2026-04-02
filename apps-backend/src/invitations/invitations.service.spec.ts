import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service';
import { Invitation } from './invitations.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../shared/role.enum';
import { InvitationStatus } from '../shared/invitation-status.enum';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { MoreThan } from 'typeorm';

jest.mock('bcryptjs');

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepository: any;
  let usersService: any;
  let mailService: any;
  let configService: any;

  const mockInvitation = {
    id: 'inv-1',
    email: 'test@example.com',
    role: Role.Employee,
    status: InvitationStatus.PENDING,
    token: 'hashed-token',
    expiresAt: new Date(Date.now() + 10000),
    invitedById: 'admin-1',
    createdAt: new Date(),
  };

  const mockAdmin = { id: 'admin-1', role: Role.Admin };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            manager: {
              transaction: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
            findOneByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendInvitationEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    invitationsRepository = module.get(getRepositoryToken(Invitation));
    usersService = module.get(UsersService);
    mailService = module.get(MailService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvitation', () => {
    it('should successfully create an invitation', async () => {    
      usersService.findOneById.mockResolvedValue(mockAdmin);        
      usersService.findOneByEmail.mockResolvedValue(null);
      invitationsRepository.findOne.mockResolvedValue(null);        
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token'); 
      invitationsRepository.create.mockReturnValue(mockInvitation); 
      invitationsRepository.save.mockResolvedValue(mockInvitation); 
      configService.get.mockReturnValue('http://localhost:5173');   

      const result = await service.createInvitation('test@example.com', Role.Employee, 'admin-1');

      expect(result.invitation).toEqual(mockInvitation);
      expect(mailService.sendInvitationEmail).toHaveBeenCalled();   
      expect(invitationsRepository.save).toHaveBeenCalled();        
    });

    it('should resend an invitation if it already exists', async () => {
      usersService.findOneById.mockResolvedValue(mockAdmin);
      usersService.findOneByEmail.mockResolvedValue(null);
      invitationsRepository.findOne.mockResolvedValue(mockInvitation);
      invitationsRepository.save.mockResolvedValue(mockInvitation);
      configService.get.mockReturnValue('http://localhost:5173');

      const result = await service.createInvitation('test@example.com', Role.Employee, 'admin-1');

      expect(result.invitation).toEqual(mockInvitation);
      expect(mailService.sendInvitationEmail).toHaveBeenCalled();
      expect(invitationsRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if inviter is not Admin or SuperAdmin', async () => {
      usersService.findOneById.mockResolvedValue({ id: 'user-1', role: Role.Employee });
      await expect(service.createInvitation('test@example.com', Role.Employee, 'user-1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if inviting for SuperAdmin role', async () => {
      usersService.findOneById.mockResolvedValue(mockAdmin);        
      await expect(service.createInvitation('test@example.com', Role.SuperAdmin, 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already exists', async () => {
      usersService.findOneById.mockResolvedValue(mockAdmin);        
      usersService.findOneByEmail.mockResolvedValue({ id: 'user-1' });
      await expect(service.createInvitation('test@example.com', Role.Employee, 'admin-1'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('should successfully accept an invitation', async () => {    
      const transactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockInvitation),        
        save: jest.fn().mockResolvedValue(true),
      };
      invitationsRepository.manager.transaction.mockImplementation((cb: any) => cb(transactionalEntityManager));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);        
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'new-user-id' }); 

      const result = await service.acceptInvitation('plain-token', 'password', 'First', 'Last');

      expect(result).toEqual({ id: 'new-user-id' });
      expect(transactionalEntityManager.save).toHaveBeenCalled();   
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const transactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),        
      };
      invitationsRepository.manager.transaction.mockImplementation((cb: any) => cb(transactionalEntityManager));

      await expect(service.acceptInvitation('invalid-token', 'password', 'First', 'Last'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException if user already exists when accepting', async () => {
      const transactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockInvitation),
        save: jest.fn(),
      };
      invitationsRepository.manager.transaction.mockImplementation((cb: any) => cb(transactionalEntityManager));
      usersService.findOneByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(service.acceptInvitation('plain-token', 'password', 'First', 'Last'))
        .rejects.toThrow(ConflictException);
    });
  });
  describe('handleCronRemoveExpiredInvitations', () => {
    it('should mark expired invitations as EXPIRED', async () => {
      const expiredInvitation = { ...mockInvitation, status: InvitationStatus.PENDING };
      invitationsRepository.find.mockResolvedValue([expiredInvitation]);
      
      await service.handleCronRemoveExpiredInvitations();

      expect(expiredInvitation.status).toBe(InvitationStatus.EXPIRED);
      expect(invitationsRepository.save).toHaveBeenCalled();
    });

    it('should do nothing if no expired invitations are found', async () => {
      invitationsRepository.find.mockResolvedValue([]);
      await service.handleCronRemoveExpiredInvitations();
      expect(invitationsRepository.save).not.toHaveBeenCalled();
    });
  });
});
