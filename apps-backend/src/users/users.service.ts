import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from '../shared/user.dto';
import { UpdateUserDto } from '../shared/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { Role } from '../shared/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto, manager?: EntityManager): Promise<Omit<User, 'password'>> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;

    if (createUserDto.role === Role.SuperAdmin) {
      throw new BadRequestException('Cannot create a user with SuperAdmin role via this endpoint.');
    }
    const hashedPassword = await this.authService.hashPassword(createUserDto.password);
    const newUser = repository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await repository.save(newUser) as User;
    const { password, ...result } = savedUser;
    return result;
  }

  async findOneByEmail(email: string, selectPassword = false): Promise<User | null> {
    const select: (keyof User)[] = ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'emailVerified', 'region', 'createdAt', 'updatedAt'];
    if (selectPassword) {
      select.push('password');
    }
    
    // Using findOne with ILike for case-insensitive email search in Postgres
    // TypeORM's findOne with select will correctly handle select:false properties when they are explicitly listed
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() }, // Assuming emails are stored in lowercase OR use ILike if not
      select,
    });
    
    return user;
  }

  async findOneById(id: string, selectSensitiveData = false): Promise<User | null> {
    const select: (keyof User)[] = ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'emailVerified', 'region', 'createdAt', 'updatedAt'];
    if (selectSensitiveData) {
      select.push('password');
    }

    const user = await this.usersRepository.findOne({ 
      where: { id },
      select 
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
      const { password, ...result } = user;
      return result;
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersRepository.preload({ id, ...updateUserDto });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (updateUserDto.password) {
      user.password = await this.authService.hashPassword(updateUserDto.password);
    }
    const { password, ...result } = await this.usersRepository.save(user);
    return result;
  }

  async remove(id: string): Promise<void> {
    const userToDelete = await this.usersRepository.findOne({ where: { id } });

    if (!userToDelete) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (userToDelete.role === Role.SuperAdmin) {
      throw new ForbiddenException('Cannot delete SuperAdmin users.');
    }

    await this.usersRepository.delete(id);
  }
}
