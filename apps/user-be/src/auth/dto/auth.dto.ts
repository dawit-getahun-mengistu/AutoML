import { IsEmail, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class SignUpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    username: string;
}

export class SignInDto {
    @ValidateIf((o) => !o.username) // Validate only if username is not provided
    @IsEmail()
    @IsNotEmpty()
    email?: string;

    @ValidateIf((o) => !o.email) // Validate only if email is not provided
    @IsString()
    @IsNotEmpty()
    username?: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}