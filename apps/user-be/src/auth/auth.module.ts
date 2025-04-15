import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "src/prisma/prisma.module";
import { AtStrategy, RtStrategy } from "./strategies";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        PrismaModule, 
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
              secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
              signOptions: { expiresIn: '15m' }, // Default options
            }),
          }),
        ],
    controllers: [AuthController],
    providers: [AuthService, AtStrategy, RtStrategy]
})
export class AuthModule {

}