import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'careequity-dev-secret';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static signToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token: string): AuthPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      return null;
    }
  }
}
