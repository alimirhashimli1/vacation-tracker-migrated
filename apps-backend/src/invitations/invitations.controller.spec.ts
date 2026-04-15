import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { Role } from '../shared/role.enum';
import { Response } from 'express';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let service: InvitationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: {
            createInvitation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvitationsController>(InvitationsController);
    service = module.get<InvitationsService>(InvitationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createInvitation', () => {
    it('should create an invitation and return the plain token', async () => {
      const createDto = { email: 'test@example.com', role: Role.Employee };
      const req = { user: { id: 'admin-id' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const mockResult = {
        invitation: { id: 'invitation-uuid' },
        plainToken: 'some-plain-token',
      };
      (service.createInvitation as jest.Mock).mockResolvedValue(mockResult);

      await controller.createInvitation(createDto, res, req as any);

      expect(service.createInvitation).toHaveBeenCalledWith(
        createDto.email,
        createDto.role,
        'admin-id',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invitation created successfully',
        invitationId: 'invitation-uuid',
        plainToken: 'some-plain-token',
      });
    });
  });
});
