import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    return next.handle().pipe(
      map((data) => {
        const elapsed = Date.now() - start;
        const handlerName = `${context.getClass().name}.${context.getHandler().name}`;
        console.log(`[Timing] ${handlerName}: ${elapsed}ms`);

        if (context.getType<string>() === 'graphql') {
          try {
            const gqlCtx = GqlExecutionContext.create(context).getContext<{ res: any }>();
            gqlCtx?.res?.setHeader?.('X-Elapsed-Time', `${elapsed}ms`);
          } catch {
            // GraphQL context may not have res in all configurations
          }
          return data;
        }

        const response = context.switchToHttp().getResponse();
        response.setHeader('X-Elapsed-Time', `${elapsed}ms`);

        // Detect @Render() routes — inject serverElapsed into template context
        const isTemplate = !!this.reflector.get('__renderTemplate__', context.getHandler());
        if (isTemplate && data && typeof data === 'object' && !Array.isArray(data)) {
          return { ...data, serverElapsed: elapsed };
        }

        return data;
      }),
    );
  }
}
