import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/types/user-role';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly users = new Map<number, User>();
  private nextId = 3;

  constructor() {
    this.seed();
  }

  findAll(): User[] {
    return [...this.users.values()];
  }

  findById(id: number): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    const normalizedEmail = this.normalizeEmail(email);
    return this.findAll().find((user) => user.email === normalizedEmail);
  }

  create(dto: CreateUserDto, passwordHash: string): User {
    const email = this.normalizeEmail(dto.email);

    if (this.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta registrada con ese email.');
    }

    const now = new Date().toISOString();
    const user: User = {
      id: this.nextId++,
      name: dto.name.trim(),
      email,
      passwordHash,
      role: dto.role,
      avatarUrl: dto.avatarUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    return user;
  }

  update(id: number, dto: UpdateUserDto): User {
    const user = this.requireById(id);
    const updated: User = {
      ...user,
      name: dto.name?.trim() ?? user.name,
      avatarUrl: dto.avatarUrl === undefined ? user.avatarUrl : dto.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updated);
    return updated;
  }

  updatePassword(id: number, passwordHash: string): User {
    const user = this.requireById(id);
    const updated = {
      ...user,
      passwordHash,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updated);
    return updated;
  }

  requireById(id: number): User {
    const user = this.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private seed(): void {
    const now = new Date().toISOString();
    const defaults: User[] = [
      {
        id: 1,
        name: 'Bruno Lopez',
        email: 'buyer@autopoint.com',
        passwordHash: bcrypt.hashSync('1234', 10),
        role: UserRole.Buyer,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Lucia Fernandez',
        email: 'seller@autopoint.com',
        passwordHash: bcrypt.hashSync('1234', 10),
        role: UserRole.Seller,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    defaults.forEach((user) => this.users.set(user.id, user));
  }
}
