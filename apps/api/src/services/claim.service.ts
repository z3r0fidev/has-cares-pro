import { Injectable, NotFoundException } from '@nestjs/common';
import { AppDataSource, Provider, User } from '@careequity/db';

@Injectable()
export class ClaimService {
  async claim(userId: string, providerId: string) {
    const providerRepo = AppDataSource.getRepository(Provider);
    const userRepo = AppDataSource.getRepository(User);

    const provider = await providerRepo.findOneBy({ id: providerId });
    if (!provider) throw new NotFoundException('Provider not found');

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    provider.is_claimed = true;
    user.provider = provider;
    user.role = 'provider';

    await providerRepo.save(provider);
    await userRepo.save(user);

    return { success: true };
  }
}
