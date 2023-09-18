import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { UserService } from 'src/user/service/user.service';

@Controller('api/statistic')
@ApiTags('Statistic')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiHeader({ name: 'version', description: '1' })
@UseGuards(JwtGuard, RolesGuard)
export class StatisticController {
  constructor(private readonly _userService: UserService) {}
}
