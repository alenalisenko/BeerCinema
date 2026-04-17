import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import * as crypto from 'crypto';

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      mergeMap((data) => {
        const body = JSON.stringify(data);
        const etag = `"${crypto.createHash('sha1').update(body).digest('hex')}"`;
        response.setHeader('ETag', etag);

        const ifNoneMatch = request.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
          response.status(304).end();
          return EMPTY;
        }

        return [data]; // оборачиваем в массив и mergeMap его разворачивает — эмитим один элемент
      }),
    );
  }
}
