import {Entity, model, property} from '@loopback/repository';

@model()
export class Tour extends Entity {
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
  name: string;

  @property({
    type: 'number',
    default: 0,
  })
  duration?: number;

  @property({
    type: 'number',
    default: 0,
  })
  maxGroupSize?: number;

  @property({
    type: 'string',
    default: 'medium',
  })
  difficulty?: string;

  @property({
    type: 'number',
    required: true,
    postgresql: {
      dataType: 'numeric',
    },
  })
  price: number;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      dataType: 'text',
    },
  })
  summary: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      dataType: 'text',
    },
  })
  description: string;

  @property({
    type: 'string',
  })
  imageCover?: string;

  @property({
    type: 'number',
    default: 4.5,
    postgresql: {
      dataType: 'numeric',
    },
  })
  ratingsAverage?: number;

  @property({
    type: 'number',
    default: 5,
    postgresql: {
      dataType: 'numeric',
    },
  })
  ratingsQuantity?: number;

  @property({
    type: 'array',
    itemType: 'string',
  })
  images?: string[];

  @property({
    type: 'array',
    itemType: 'date',
  })
  startDates?: string[];

  constructor(data?: Partial<Tour>) {
    super(data);
  }
}

export interface TourRelations {
  // describe navigational properties here
}

export type TourWithRelations = Tour & TourRelations;
