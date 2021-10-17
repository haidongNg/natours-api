import {Entity, model, property} from '@loopback/repository';

@model()
export class MemberCredentials extends Entity {
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
  password: string;

  @property({
    type: 'string',
  })
  memberId?: string;

  constructor(data?: Partial<MemberCredentials>) {
    super(data);
  }
}

export interface MemberCredentialsRelations {
  // describe navigational properties here
}

export type MemberCredentialsWithRelations = MemberCredentials &
  MemberCredentialsRelations;
