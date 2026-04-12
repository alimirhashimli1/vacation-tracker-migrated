import { Controller, Get, Post, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeedingService } from '../seeds/seeding.service';

@Controller('test')
export class TestController {
  private readonly logger = new Logger(TestController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly seedingService: SeedingService,
  ) {}

  @Get()
  getTest(): string {
    return 'Test route works!';
  }

  @Post('reset')
  async resetDatabase() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      this.logger.warn('Attempted to reset database in production environment!');
      throw new ForbiddenException('Resetting database is not allowed in production.');
    }

    this.logger.log('Resetting database via TestController...');
    await this.seedingService.resetAndSeed();
    return { message: 'Database reset and seeded successfully' };
  }
}
