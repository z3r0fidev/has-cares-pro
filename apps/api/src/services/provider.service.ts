import { Injectable } from '@nestjs/common';
import { Provider, AppDataSource } from '@careequity/db';

@Injectable()
export class ProviderService {
  async findOne(id: string): Promise<Provider | null> {
    const repo = AppDataSource.getRepository(Provider);
    return repo.findOneBy({ id });
  }
}
