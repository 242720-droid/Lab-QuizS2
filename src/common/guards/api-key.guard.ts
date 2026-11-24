import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey =
      (request.headers['x-api-key'] as string) ||
      (request.headers['api-key'] as string);

    const validApiKey = process.env.API_KEY || 'food-quiz-secret-key-2026';

    if (!apiKey) {
      throw new UnauthorizedException(
        'Access denied: Missing "x-api-key" header. Please provide a valid API key to access menu items.',
      );
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException(
        'Access denied: Invalid API key provided.',
      );
    }

    return true;
  }
}
