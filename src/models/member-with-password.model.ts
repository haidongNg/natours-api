import {model, property} from '@loopback/repository';
import {Member} from './member.model';

@model()
export class MemberWithPassword extends Member {
  @property({
    type: 'string',
  })
  password: string;
}
