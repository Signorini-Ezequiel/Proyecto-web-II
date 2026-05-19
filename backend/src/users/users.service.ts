import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser, toPublicUser, User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll(): PublicUser[] {
    return this.usersRepository.findAll().map(toPublicUser);
  }

  findById(id: number): PublicUser {
    return toPublicUser(this.usersRepository.requireById(id));
  }

  findPrivateById(id: number): User {
    return this.usersRepository.requireById(id);
  }

  findPrivateByEmail(email: string): User | undefined {
    return this.usersRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return toPublicUser(this.usersRepository.create(dto, passwordHash));
  }

  update(id: number, dto: UpdateUserDto): PublicUser {
    return toPublicUser(this.usersRepository.update(id, dto));
  }

  async updatePassword(id: number, dto: UpdatePasswordDto): Promise<PublicUser> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('La nueva contrasena y su confirmacion no coinciden.');
    }

    const user = this.usersRepository.requireById(id);
    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('La contrasena actual no coincide.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    return toPublicUser(this.usersRepository.updatePassword(id, passwordHash));
  }
}
