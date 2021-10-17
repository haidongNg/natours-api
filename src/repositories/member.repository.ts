import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasOneRepositoryFactory,
  repository,
} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Member, MemberCredentials, MemberRelations} from '../models';
import {MemberCredentialsRepository} from './member-credentials.repository';

export type Credentials = {
  email: string;
  password: string;
};

export class MemberRepository extends DefaultCrudRepository<
  Member,
  typeof Member.prototype.id,
  MemberRelations
> {
  public readonly memberCredentials: HasOneRepositoryFactory<
    MemberCredentials,
    typeof Member.prototype.id
  >;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('MemberCredentialsRepository')
    protected memberCredentialsRepositoryGetter: Getter<MemberCredentialsRepository>,
  ) {
    super(Member, dataSource);
    this.memberCredentials = this.createHasOneRepositoryFactoryFor(
      'memberCredentials',
      memberCredentialsRepositoryGetter,
    );
    this.registerInclusionResolver(
      'memberCredentials',
      this.memberCredentials.inclusionResolver,
    );
  }

  async findCredentials(
    memberId: typeof Member.prototype.id,
  ): Promise<MemberCredentials | undefined> {
    try {
      return await this.memberCredentials(memberId).get();
    } catch (err) {
      if (err.code === 'findCredentials') {
        return undefined;
      }
      throw err;
    }
  }
}
