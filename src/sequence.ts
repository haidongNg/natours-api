import {MiddlewareSequence, RequestContext} from '@loopback/rest';

export class MySequence extends MiddlewareSequence {
  async handle(context: RequestContext) {
    // TODO
    //console.log(context.request.headers.cookie);
    await super.handle(context);
  }
}
