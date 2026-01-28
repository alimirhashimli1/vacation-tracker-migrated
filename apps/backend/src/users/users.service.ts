import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../../../shared/user.dto';
import { UpdateUserDto } from '../../../../shared/update-user.dto';
import { Role } from '../../../../shared/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<Omit<User, 'password'>> {
    if (userData.role === Role.SuperAdmin) {
      throw new BadRequestException('Cannot create a user with SuperAdmin role via this endpoint.');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || Role.Employee,
    });
    const { password, ...result } = await this.usersRepository.save(newUser);
    return result;
  }

  async findOne(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async findOneById(id: string, selectSensitiveData = false): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (selectSensitiveData) {
      return user;
    }
    const { password, ...result } = user;
    return result as User;
  }

  async findOneByEmail(email: string, selectPassword = false): Promise<User | null> {
    if (selectPassword) {
      return this.usersRepository.findOne({ where: { email }, select: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'isActive', 'createdAt', 'updatedAt'] });
    }
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;
    const { password, ...result } = user;
    return result as User;
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
      user.password = await bcrypt.hash(updateUserDto.password, 10);
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
