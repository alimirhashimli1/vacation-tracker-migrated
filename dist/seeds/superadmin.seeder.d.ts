import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class SuperAdminSeeder {
    private readonly userRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>);
    seed(): Promise<void>;
}
