import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SignInDto, SignUpDto } from "./dto";
import * as argon from 'argon2';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { access } from "fs";
import { NotFoundError, throwError } from "rxjs";

@Injectable()
export class AuthService{
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,

    ){}

    async signin(dto: SignInDto){
        // find the user by email or username
        const user = await this.prisma.user.findFirst({
            where: {
              OR: [
                { email: dto.email },
                { username: dto.username },
              ],
            },
          });
      
          if (!user) {
            throw new ForbiddenException('credentials incorrect');
          }

        // compare password
        const pwMatches = await argon.verify(
            user.passwordHash,
            dto.password
        );
        // if password incorrect throw exception
        if (!pwMatches){
            throw new ForbiddenException('credentials incorrect');

        }

        // create a refresh token ans save the hash
        const refresh_token = await this.signRefreshToken(user.id, user.username);

        await this.saveRefreshToken(user.id, refresh_token);


        // create acceess token
        const access_token = await this.signAccessToken(user.id, user.username);

        return{
            refresh_token: refresh_token,
            access_token: access_token,
        }
    }

    async signup(dto: SignUpDto){
        // generate the password hash
        const passwordHash = await argon.hash(dto.password)


        try {
            // save the new  user in the db
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                passwordHash,
            },
        })

        delete user.passwordHash;
        return user;
        } catch (error){
            if (error instanceof PrismaClientKnownRequestError){
                if (error.code === 'P2002'){
                    throw new ForbiddenException('Credentials taken');
                }
            }
            throw error;
        }
    }

    async refresh(userId: string, userName: string){
        const new_access_token = await this.signAccessToken(userId, userName);
        return {
            access_token: new_access_token
        }
    }

    async logOut(userId: string){
        try {
            await this.prisma.refreshToken.update({
                where: {
                    userId: userId,
                },
                data: {
                    hash: null
                }
            })
        } catch(error){
            if (error === 'RecordNotFound') { 
                return throwError(() => new Error('User has already logged out!'));
              }
        }

        return {
            msg: 'Logout successful'
        }
    }

    signRefreshToken(userId: string, userName: string){
        return this.jwtService.sign({userId, userName}, {
            secret: this.config.get('REFRESH_TOKEN_SECRET'),
            expiresIn: '7d'
        });

    }
    

    signAccessToken(userId: string, userName: string){
        return this.jwtService.sign({userId, userName}, {
            secret: this.config.get('ACCESS_TOKEN_SECRET'),
            expiresIn: '15m'
        });

    }

    async saveRefreshToken(userId: string, refresh_token: string){
        const hash_of_refresh = await bcrypt.hash(refresh_token, 10);
    try {
      await this.prisma.refreshToken.create({
        data: {
          userId: userId,
          hash: hash_of_refresh,
        },
      });
    } catch (error) {
      await this.prisma.refreshToken.update({
        where: {
          userId: userId,
        },
        data: {
          hash: hash_of_refresh,
        },
      });
    }

    }

    

}