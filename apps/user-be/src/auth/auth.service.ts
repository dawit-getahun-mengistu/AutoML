import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SignInDto, SignUpDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Injectable()
export class AuthService{
    constructor(private prisma: PrismaService){}

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
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true
            }
        })

        // delete user.passwordHash

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

        delete user.passwordHash
        return user;

    }

}