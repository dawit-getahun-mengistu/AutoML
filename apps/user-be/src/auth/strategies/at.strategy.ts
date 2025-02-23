import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';


// Access Token Strategy
@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'access_strategy') {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('ACCESS_TOKEN_SECRET'),
      ignoreExpiration: false,
    });
  }
  validate(payload: { userId: string; userName: string }) {
    return payload;
  }
}
