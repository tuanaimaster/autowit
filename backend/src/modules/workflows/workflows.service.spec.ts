import { BadGatewayException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import axios from 'axios';
import { WorkflowsService } from './workflows.service';
import { WorkflowEntity } from './workflow.entity';

jest.mock('axios');

describe('WorkflowsService', () => {
  const mockedAxios = axios as any;

  let repo: any;
  let cfg: any;
  let service: WorkflowsService;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    cfg = {
      get: jest.fn(),
    };

    service = new WorkflowsService(
      repo as unknown as Repository<WorkflowEntity>,
      cfg as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('triggers webhook and updates counters when webhookUrl is present', async () => {
    const workflow: WorkflowEntity = {
      id: 'wf-1',
      userId: 'u-1',
      name: 'WF',
      description: null,
      status: 'active',
      trigger: 'webhook',
      triggerConfig: {},
      steps: [],
      webhookUrl: 'https://example.com/hook',
      runCount: 0,
      lastRunAt: null,
      user: {} as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repo.findOne.mockResolvedValue(workflow);
    repo.save.mockResolvedValue(workflow);
    mockedAxios.post.mockResolvedValue({ data: { ok: true } } as any);

    const result = await service.execute('wf-1', 'u-1', { hello: 'world' });

    expect(mockedAxios.post).toHaveBeenCalledWith('https://example.com/hook', { hello: 'world' }, { timeout: 30_000 });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('returns local execution metadata when webhookUrl is missing', async () => {
    const workflow: WorkflowEntity = {
      id: 'wf-2',
      userId: 'u-1',
      name: 'WF2',
      description: null,
      status: 'draft',
      trigger: 'manual',
      triggerConfig: {},
      steps: [{ type: 'noop', config: {} }],
      webhookUrl: null,
      runCount: 1,
      lastRunAt: null,
      user: {} as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repo.findOne.mockResolvedValue(workflow);
    repo.save.mockResolvedValue(workflow);

    const result = await service.execute('wf-2', 'u-1');

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'executed', workflowId: 'wf-2', steps: 1 });
  });

  it('throws BadGatewayException when webhook call fails', async () => {
    const workflow: WorkflowEntity = {
      id: 'wf-3',
      userId: 'u-1',
      name: 'WF3',
      description: null,
      status: 'active',
      trigger: 'webhook',
      triggerConfig: {},
      steps: [],
      webhookUrl: 'https://example.com/hook',
      runCount: 0,
      lastRunAt: null,
      user: {} as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repo.findOne.mockResolvedValue(workflow);
    mockedAxios.post.mockRejectedValue(new Error('timeout'));

    await expect(service.execute('wf-3', 'u-1', {})).rejects.toBeInstanceOf(BadGatewayException);
  });
});
