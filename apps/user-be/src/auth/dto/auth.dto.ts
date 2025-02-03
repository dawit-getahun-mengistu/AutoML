import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class SignUpDto {
    @ApiProperty({
        description: 'The email of the user',
      })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The password of the user',
      })
    @IsString()
    @IsNotEmpty()
    password: string;
    
    @ApiProperty({
        description: 'The username of the user',
      })
    @IsString()
    @IsNotEmpty()
    username: string;
}

export class SignInDto {
    @ApiProperty({
        description: 'The email of the user',
      })
    @ValidateIf((o) => !o.username) // Validate only if username is not provided
    @IsEmail()
    @IsNotEmpty()
    email?: string;
    
    @ApiProperty({
        description: 'A prefered username. It must be unique.',
      })
    @ValidateIf((o) => !o.email) // Validate only if email is not provided
    @IsString()
    @IsNotEmpty()
    username?: string;

    @ApiProperty({
        description: 'The password of the user',
      })
    @IsString()
    @IsNotEmpty()
    password: string;
}