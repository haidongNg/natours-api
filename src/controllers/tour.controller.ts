import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Tour} from '../models';
import {TourRepository} from '../repositories';

export class TourController {
  constructor(
    @repository(TourRepository)
    public tourRepository : TourRepository,
  ) {}

  @post('/tours')
  @response(200, {
    description: 'Tour model instance',
    content: {'application/json': {schema: getModelSchemaRef(Tour)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Tour, {
            title: 'NewTour',
            exclude: ['id'],
          }),
        },
      },
    })
    tour: Omit<Tour, 'id'>,
  ): Promise<Tour> {
    return this.tourRepository.create(tour);
  }

  @get('/tours/count')
  @response(200, {
    description: 'Tour model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Tour) where?: Where<Tour>,
  ): Promise<Count> {
    return this.tourRepository.count(where);
  }

  @get('/tours')
  @response(200, {
    description: 'Array of Tour model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Tour, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Tour) filter?: Filter<Tour>,
  ): Promise<Tour[]> {
    return this.tourRepository.find(filter);
  }

  @patch('/tours')
  @response(200, {
    description: 'Tour PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Tour, {partial: true}),
        },
      },
    })
    tour: Tour,
    @param.where(Tour) where?: Where<Tour>,
  ): Promise<Count> {
    return this.tourRepository.updateAll(tour, where);
  }

  @get('/tours/{id}')
  @response(200, {
    description: 'Tour model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Tour, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Tour, {exclude: 'where'}) filter?: FilterExcludingWhere<Tour>
  ): Promise<Tour> {
    return this.tourRepository.findById(id, filter);
  }

  @patch('/tours/{id}')
  @response(204, {
    description: 'Tour PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Tour, {partial: true}),
        },
      },
    })
    tour: Tour,
  ): Promise<void> {
    await this.tourRepository.updateById(id, tour);
  }

  @put('/tours/{id}')
  @response(204, {
    description: 'Tour PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() tour: Tour,
  ): Promise<void> {
    await this.tourRepository.replaceById(id, tour);
  }

  @del('/tours/{id}')
  @response(204, {
    description: 'Tour DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.tourRepository.deleteById(id);
  }
}
