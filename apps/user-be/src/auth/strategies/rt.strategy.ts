import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'refresh_strategy') {
  constructor(private config: ConfigService, private dataBase: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(req: Request, payload: { userId: string; userName: string }) {
    const refresh_token = req
      ?.get('authorization')
      ?.replace('Bearer', '')
      .trim();

    const cached_refresh_hash = await this.dataBase.refreshToken.findUnique({
      where: {
        userId: payload.userId,
      },
      select: {
        hash: true,
      },
    });

    if (!cached_refresh_hash || cached_refresh_hash.hash === null) {
      throw new UnauthorizedException(
        'Refresh token not found , please login again',
      );
    }

    const result = await bcrypt.compare(
      refresh_token,
      cached_refresh_hash.hash,
    );

    if (result !== true) {
      throw new UnauthorizedException(
        'Refresh token not found , please login again',
      );
    }

    return payload;
  }
}
