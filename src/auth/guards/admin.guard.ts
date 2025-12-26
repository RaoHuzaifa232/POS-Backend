import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const result = super.canActivate(context);
    
    if (result instanceof Observable) {
      return result.pipe(
        map((isAuthenticated) => {
          if (!isAuthenticated) {
            return false;
          }

          const request = context.switchToHttp().getRequest();
          const user = request.user;

          if (user?.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
          }

          return true;
        })
      );
    } else if (result instanceof Promise) {
      return result.then((isAuthenticated) => {
        if (!isAuthenticated) {
          return false;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user?.role !== 'admin') {
          throw new ForbiddenException('Admin access required');
        }

        return true;
      });
    } else {
      // Synchronous boolean result
      if (!result) {
        return false;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (user?.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      return true;
    }
  }
}
