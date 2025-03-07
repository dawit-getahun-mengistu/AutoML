import { Exclude } from "class-transformer";
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";


export class UserResponseDto {
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;


    @IsDate()
    createdAt: Date;

    @IsDate()
    @IsOptional()
    updatedAt?: Date;

    @Exclude()
    passwordHash?: string;
    

}

export class UserUpdateDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}