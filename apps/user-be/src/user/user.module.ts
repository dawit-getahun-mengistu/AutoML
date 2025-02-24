import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from 'src/auth/auth.module';
import { AtStrategy } from 'src/auth/strategies';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, AtStrategy]
})
export class UserModule {}
