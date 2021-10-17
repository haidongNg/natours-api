import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {MemberCredentials, MemberCredentialsRelations} from '../models';

export class MemberCredentialsRepository extends DefaultCrudRepository<
  MemberCredentials,
  typeof MemberCredentials.prototype.id,
  MemberCredentialsRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(MemberCredentials, dataSource);
  }
}
