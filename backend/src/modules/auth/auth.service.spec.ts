import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: any;
  let jwt: any;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      create: jest.fn(),
    };

    jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService);
  });

  it('logs in with valid credentials', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      role: 'user',
      isActive: true,
    } as any);
    users.validatePassword.mockResolvedValue(true);

    const result = await service.login('user@example.com', 'secret');

    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      role: 'user',
    });
    expect(jwt.sign).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorizedException for wrong password', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      isActive: true,
    } as any);
    users.validatePassword.mockResolvedValue(false);

    await expect(service.login('user@example.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ConflictException for duplicate email on register', async () => {
    users.findByEmail.mockResolvedValue({ id: 'existing' } as any);

    await expect(service.register('user@example.com', 'secret')).rejects.toBeInstanceOf(ConflictException);
  });
});
