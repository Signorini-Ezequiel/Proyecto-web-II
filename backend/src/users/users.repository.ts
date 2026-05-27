import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/types/user-role';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map((user) => this.mapUser(user));
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapUser(user) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    return user ? this.mapUser(user) : undefined;
  }

  async create(dto: CreateUserDto, passwordHash: string): Promise<User> {
    const email = this.normalizeEmail(dto.email);

    if (await this.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta registrada con ese email.');
    }

    const created = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        password: passwordHash,
        role: this.toPrismaRole(dto.role),
        avatar: dto.avatarUrl ?? null,
      },
    });

    return this.mapUser(created);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.requireById(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? user.name,
        avatar: dto.avatarUrl === undefined ? user.avatarUrl : dto.avatarUrl,
      },
    });

    return this.mapUser(updated);
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    await this.requireById(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });

    return this.mapUser(updated);
  }

  async requireById(id: string): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  private mapUser(user: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: PrismaUserRole;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.password,
      role: this.mapRole(user.role),
      avatarUrl: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private mapRole(role: PrismaUserRole): UserRole {
    switch (role) {
      case 'SELLER':
        return UserRole.Seller;
      case 'BUYER':
      default:
        return UserRole.Buyer;
    }
  }

  private toPrismaRole(role: UserRole): PrismaUserRole {
    switch (role) {
      case UserRole.Seller:
        return 'SELLER';
      case UserRole.Buyer:
      default:
        return 'BUYER';
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
