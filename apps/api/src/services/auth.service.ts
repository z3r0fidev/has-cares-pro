import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AppDataSource, User } from '@careequity/db';
import { AuthUtils } from '@careequity/core';

@Injectable()
export class AuthService {
  async register(email: string, password: string, role: 'patient' | 'provider' | 'admin' = 'patient') {
    const repo = AppDataSource.getRepository(User);
    const exists = await repo.findOneBy({ email });
    if (exists) throw new ConflictException('User already exists');

    const user = new User();
    user.email = email;
    user.password_hash = await AuthUtils.hashPassword(password);
    user.role = role;

    await repo.save(user);
    return this.login(email, password);
  }

  async login(email: string, password: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email }, relations: ['provider'] });
    
    if (!user || !(await AuthUtils.comparePassword(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = AuthUtils.signToken({ 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      providerId: user.provider?.id 
    });

    return { access_token: token, user: { email: user.email, role: user.role } };
  }
}
