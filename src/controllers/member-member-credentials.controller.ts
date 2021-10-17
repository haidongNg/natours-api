import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Member,
  MemberCredentials,
} from '../models';
import {MemberRepository} from '../repositories';

export class MemberMemberCredentialsController {
  constructor(
    @repository(MemberRepository) protected memberRepository: MemberRepository,
  ) { }

  @get('/members/{id}/member-credentials', {
    responses: {
      '200': {
        description: 'Member has one MemberCredentials',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MemberCredentials),
          },
        },
      },
    },
  })
  async get(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<MemberCredentials>,
  ): Promise<MemberCredentials> {
    return this.memberRepository.memberCredentials(id).get(filter);
  }

  @post('/members/{id}/member-credentials', {
    responses: {
      '200': {
        description: 'Member model instance',
        content: {'application/json': {schema: getModelSchemaRef(MemberCredentials)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Member.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MemberCredentials, {
            title: 'NewMemberCredentialsInMember',
            exclude: ['id'],
            optional: ['memberId']
          }),
        },
      },
    }) memberCredentials: Omit<MemberCredentials, 'id'>,
  ): Promise<MemberCredentials> {
    return this.memberRepository.memberCredentials(id).create(memberCredentials);
  }

  @patch('/members/{id}/member-credentials', {
    responses: {
      '200': {
        description: 'Member.MemberCredentials PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MemberCredentials, {partial: true}),
        },
      },
    })
    memberCredentials: Partial<MemberCredentials>,
    @param.query.object('where', getWhereSchemaFor(MemberCredentials)) where?: Where<MemberCredentials>,
  ): Promise<Count> {
    return this.memberRepository.memberCredentials(id).patch(memberCredentials, where);
  }

  @del('/members/{id}/member-credentials', {
    responses: {
      '200': {
        description: 'Member.MemberCredentials DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(MemberCredentials)) where?: Where<MemberCredentials>,
  ): Promise<Count> {
    return this.memberRepository.memberCredentials(id).delete(where);
  }
}
