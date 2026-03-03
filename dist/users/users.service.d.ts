import { Repository, EntityManager } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from '../shared/user.dto';
import { UpdateUserDto } from '../shared/update-user.dto';
import { AuthService } from '../auth/auth.service';
export declare class UsersService {
    private usersRepository;
    private authService;
    constructor(usersRepository: Repository<User>, authService: AuthService);
    create(createUserDto: CreateUserDto, manager?: EntityManager): Promise<Omit<User, 'password'>>;
    findOneByEmail(email: string, selectPassword?: boolean): Promise<User | null>;
    findOneById(id: string, selectSensitiveData?: boolean): Promise<User | null>;
    findAll(): Promise<Omit<User, 'password'>[]>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'> | null>;
    remove(id: string): Promise<void>;
}
