import {Entity, hasOne, model, property} from '@loopback/repository';
import {MemberCredentials} from './member-credentials.model';

@model()
export class Member extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'uuidv4',
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'array',
    itemType: 'string',
    default: ['customer'],
  })
  roles: string[];

  @hasOne(() => MemberCredentials)
  memberCredentials: MemberCredentials;

  @property({
    type: 'string',
  })
  resetKey?: string;

  @property({
    type: 'number',
  })
  resetCount: number;

  @property({
    type: 'string',
  })
  resetTimestamp: string;

  @property({
    type: 'string',
  })
  resetKeyTimestamp: string;

  constructor(data?: Partial<Member>) {
    super(data);
  }
}

export interface MemberRelations {
  // describe navigational properties here
}

export type MemberWithRelations = Member & MemberRelations;
