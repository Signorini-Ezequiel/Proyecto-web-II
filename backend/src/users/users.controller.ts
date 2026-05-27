import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { PublicUser } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista usuarios sin datos sensibles.' })
  async findAll(@Req() request: AuthenticatedRequest): Promise<PublicUser[]> {
    this.ensureAdminLikeAccess(request);
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Obtiene un usuario por id.' })
  async findById(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicUser> {
    this.ensureOwnProfile(id, request);
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Actualiza el perfil de un usuario.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicUser> {
    this.ensureOwnProfile(id, request);
    return this.usersService.update(id, dto);
  }

  @Patch(':id/password')
  @ApiOkResponse({ description: 'Actualiza la contrasena de un usuario.' })
  async updatePassword(
    @Param('id') id: string,
    @Body() dto: UpdatePasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicUser> {
    this.ensureOwnProfile(id, request);
    return this.usersService.updatePassword(id, dto);
  }

  private ensureOwnProfile(id: string, request: AuthenticatedRequest): void {
    if (request.user.sub !== id) {
      throw new ForbiddenException('No puedes modificar otro perfil.');
    }
  }

  private ensureAdminLikeAccess(request: AuthenticatedRequest): void {
    void request;
    throw new ForbiddenException('No puedes listar usuarios.');
  }
}
