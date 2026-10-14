import { HttpException } from './http-exception.js';

export class UnauthorizedException extends HttpException {
  constructor(description = 'UNAUTHORIZED') {
    super(401, description);
  }
}
