import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from '../context/requestContext';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;


    let result: Observable<any>;
    RequestContext.run(
      {
        userId: user?.sub ?? user?.id,
        groupId: user?.groupId,
        membershipId: user?.membershipId,
        role: user?.role,
      },
      () => {
        result = next.handle();
      },
    );
    return result!;
  }
}
