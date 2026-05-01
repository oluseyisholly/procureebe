// user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    console.log('User Decorator - Request User:', user); // Debug log to check the user object  
    // If a specific property is requested (e.g., @User('email')), return only that
    return data ? user?.[data] : user;
  },
);
