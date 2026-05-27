import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../common/constants/auth.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser } from './entities/user.entity';
import type { PublicUser, User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<PublicUser[]> {
    return (await this.usersRepository.findAll()).map(toPublicUser);
  }

  async findById(id: string): Promise<PublicUser> {
    return toPublicUser(await this.usersRepository.requireById(id));
  }

  async findPrivateById(id: string): Promise<User> {
    return this.usersRepository.requireById(id);
  }

  async findPrivateByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    return toPublicUser(await this.usersRepository.create(dto, passwordHash));
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    return toPublicUser(await this.usersRepository.update(id, dto));
  }

  async updatePassword(
    id: string,
    dto: UpdatePasswordDto,
  ): Promise<PublicUser> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'La nueva contrasena y su confirmacion no coinciden.',
      );
    }

    const user = await this.usersRepository.requireById(id);
    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('La contrasena actual no coincide.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    return toPublicUser(await this.usersRepository.updatePassword(id, passwordHash));
  }
}
