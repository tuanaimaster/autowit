import { Controller, ForbiddenException, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { CostTrackerService } from '../../core/cost-tracker/cost-tracker.service';

function isAdmin(req: any): boolean {
  return req.user?.role === 'admin';
}

@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(
    private users: UsersService,
    private costs: CostTrackerService,
  ) {}

  @Get('users')
  getUsers(@Request() req: any) {
    if (!isAdmin(req)) throw new ForbiddenException('Forbidden');
    return this.users.list();
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    if (!isAdmin(req)) throw new ForbiddenException('Forbidden');
    const [today, weekly] = await Promise.all([
      this.costs.getDailyStats(),
      this.costs.getWeeklyTotal(),
    ]);
    return { today, weeklyTotalUsd: weekly };
  }
}
