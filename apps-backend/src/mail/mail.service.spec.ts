import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const template = 'test-template';
      const context = { key: 'value' };

      await service.sendMail(to, subject, template, context);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject,
        template,
        context,
      });
    });
  });

  describe('sendInvitationEmail', () => {
    it('should call sendMail with invitation template and link', async () => {
      const email = 'user@example.com';
      const inviteLink = 'http://example.com/invite';
      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(undefined);

      await service.sendInvitationEmail(email, inviteLink);

      expect(sendMailSpy).toHaveBeenCalledWith(
        email,
        'Invitation to join the platform',
        'invitation',
        { invitationLink: inviteLink },
      );
    });
  });
});
