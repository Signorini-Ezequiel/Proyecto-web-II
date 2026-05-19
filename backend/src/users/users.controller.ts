import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { PublicUser } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista usuarios sin datos sensibles.' })
  findAll(): PublicUser[] {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Obtiene un usuario por id.' })
  findById(@Param('id', ParseIntPipe) id: number): PublicUser {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Actualiza el perfil de un usuario.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): PublicUser {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/password')
  @ApiOkResponse({ description: 'Actualiza la contrasena de un usuario.' })
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePasswordDto,
  ): Promise<PublicUser> {
    return this.usersService.updatePassword(id, dto);
  }
}
