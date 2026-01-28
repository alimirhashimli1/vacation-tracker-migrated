import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../../../shared/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
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

  async findOneByEmail(email: string, selectPassword = false): Promise<User | null> {
    if (selectPassword) {
      return this.usersRepository.findOne({ where: { email }, select: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'isActive', 'createdAt', 'updatedAt'] });
    }
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;
    const { password, ...result } = user;
    return result as User;
  }
}
