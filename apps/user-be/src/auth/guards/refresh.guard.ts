import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh_strategy') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        console.log('Request Headers:', request.headers); // Log all headers
    console.log('Authorization Token:', request.headers.authorization); 
        return super.canActivate(context);

        
    }
}  