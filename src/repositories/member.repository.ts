import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Member, MemberRelations} from '../models';

export type Credentials = {
  email: string;
  password: string;
};

export class MemberRepository extends DefaultCrudRepository<
  Member,
  typeof Member.prototype.id,
  MemberRelations
> {
  constructor(@inject('datasources.postgres') dataSource: PostgresDataSource) {
    super(Member, dataSource);
  }
}
