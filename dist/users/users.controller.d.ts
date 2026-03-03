import { UsersService } from './users.service';
import { CreateUserDto } from '../shared/user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from '../shared/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>>;
    findAll(): Promise<Omit<User, 'password'>[]>;
    findOne(id: string, req: any): Promise<Omit<User, 'password'> | null>;
    update(id: string, updateUserDto: UpdateUserDto, req: any): Promise<Omit<User, 'password'> | null>;
    remove(id: string): Promise<void>;
}
