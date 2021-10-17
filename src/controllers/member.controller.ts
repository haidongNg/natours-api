import {UserServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {
  FilterExcludingWhere,
  model,
  property,
  repository,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {Member} from '../models';
import {MemberRepository} from '../repositories';
import {MemberManagementService} from '../services';

@model()
export class NewUserRequest extends Member {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

export class MemberController {
  constructor(
    @repository(MemberRepository)
    public memberRepository: MemberRepository,
    @inject(UserServiceBindings.USER_SERVICE)
    public memberManagementService: MemberManagementService,
  ) {}

  @post('/members')
  @response(200, {
    description: 'Member model instance',
    content: {'application/json': {schema: getModelSchemaRef(Member)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUserRequest, {
            title: 'NewMember',
            exclude: ['id'],
          }),
        },
      },
    })
    newUserRequest: Omit<NewUserRequest, 'id'>,
  ): Promise<Member> {
    return this.memberManagementService.createMember(newUserRequest);
  }

  @get('/members/{id}')
  @response(200, {
    description: 'Member model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Member, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Member, {exclude: 'where'})
    filter?: FilterExcludingWhere<Member>,
  ): Promise<Member> {
    return this.memberRepository.findById(id, filter);
  }

  @patch('/members/{id}')
  @response(204, {
    description: 'Member PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Member, {partial: true}),
        },
      },
    })
    member: Member,
  ): Promise<void> {
    await this.memberRepository.updateById(id, member);
  }

  @del('/members/{id}')
  @response(204, {
    description: 'Member DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.memberRepository.deleteById(id);
  }
}
