import {
  NestInterceptor,
  ExecutionContext,
  Injectable,
  CallHandler,
} from '@nestjs/common'
import { instanceToPlain } from 'class-transformer'
import { map } from 'rxjs/operators'

/**
 * Convert class instances to plain object before sending the response so that properties that are marked with `@Exclude()` are excluded from response.
 */
@Injectable()
export class TransformToPlainInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(map(data => instanceToPlain(data)))
  }
}
