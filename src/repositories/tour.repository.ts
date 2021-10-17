import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Tour, TourRelations} from '../models';

export class TourRepository extends DefaultCrudRepository<
  Tour,
  typeof Tour.prototype.id,
  TourRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(Tour, dataSource);
  }
}
