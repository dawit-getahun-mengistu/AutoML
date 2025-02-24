import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto, SignUpDto } from "./dto";
import { AuthGuard } from "@nestjs/passport";
import { RefreshAuthGuard } from "./guards";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";


@ApiTags('Auth')
@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService){ }

    @Post('signup')
    signup(@Body() dto: SignUpDto){
        return this.authService.signup(dto);
    }

    @Post('signin')
    signin(@Body() dto: SignInDto){
        return this.authService.signin(dto);

    }

    
    @UseGuards(AuthGuard('refresh_strategy'))
    @ApiBearerAuth('refresh-token')
    @Post('refresh')
    refreshToken(@Req() req) {
      
      const user = req.user;
      return this.authService.refresh(user.userId, user.userName);
    }

    
    @UseGuards(AuthGuard('refresh_strategy'))
    @ApiBearerAuth('refresh-token')
    @Post('logout')
    logOut(@Req() req) {
      const user = req.user;
      return this.authService.logOut(user.userId);
    }

}