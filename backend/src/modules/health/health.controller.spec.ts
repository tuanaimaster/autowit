import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { HealthController } from './health.controller';

jest.mock('axios');

describe('HealthController', () => {
  const mockedAxios = axios as any;

  let dataSource: any;
  let redis: any;
  let config: any;
  let controller: HealthController;

  beforeEach(() => {
    dataSource = {
      query: async () => [{ '?column?': 1 }],
    };

    redis = {
      ping: async () => 'PONG',
    };

    config = {
      get: () => 'http://127.0.0.1:5678',
    };

    mockedAxios.get.mockResolvedValue({ status: 200 } as any);

    controller = new HealthController(
      dataSource as unknown as DataSource,
      redis as any,
      config as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok when all dependencies are up', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.redis).toBe('up');
    expect(result.n8n).toBe('up');
  });

  it('returns degraded when database is down', async () => {
    jest.spyOn(dataSource, 'query').mockRejectedValueOnce(new Error('db down'));

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('down');
    expect(result.redis).toBe('up');
  });

  it('returns degraded when n8n is down', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('n8n down'));

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.n8n).toBe('down');
  });
});
