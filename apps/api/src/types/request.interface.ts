import { Request } from 'express';
import { AuthPayload } from '@careequity/core';

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}
