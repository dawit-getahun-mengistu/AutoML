import { Exclude } from "class-transformer";
import { 
    IsDate, 
    IsEmail, 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    IsUUID 
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
    @ApiProperty({
        description: "Unique identifier for the user",
        example: "550e8400-e29b-41d4-a716-446655440000"
    })
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        description: "Username of the user",
        example: "johndoe"
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: "Email address of the user",
        example: "johndoe@example.com"
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: "Date and time when the user was created",
        example: "2024-03-19T12:00:00Z"
    })
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        description: "Date and time when the user was last updated",
        example: "2024-03-20T14:30:00Z",
        required: false
    })
    @IsDate()
    @IsOptional()
    updatedAt?: Date;

    @Exclude()
    passwordHash?: string;
}

export class UserUpdateDto {
    @ApiProperty({
        description: "New username of the user",
        example: "janedoe",
        required: false
    })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({
        description: "New email address of the user",
        example: "janedoe@example.com",
        required: false
    })
    @IsEmail()
    @IsOptional()
    email?: string;
}
