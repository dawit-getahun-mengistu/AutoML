import { Test, TestingModule } from '@nestjs/testing';
import { DataProfilingConsumerService } from './data-profiling-consumer.service';

describe('DataProfilingConsumerService', () => {
  let service: DataProfilingConsumerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataProfilingConsumerService],
    }).compile();

    service = module.get<DataProfilingConsumerService>(DataProfilingConsumerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
