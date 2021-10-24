import {
  authenticate,
  TokenService,
  UserService,
} from '@loopback/authentication';
import {
  TokenServiceBindings,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
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
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {PasswordHasherBindings} from '../keys';
import {Member} from '../models';
import {Credentials, MemberRepository} from '../repositories';
import {MemberManagementService} from '../services';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {
  CredentialsRequestBody,
  MemberProfileSchema,
  PasswordResetRequestBody,
} from './specs/member-controller.specs';

@model()
export class NewUserRequest extends Member {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}
const RESOURCE_NAME = 'project';
const ACL_MEMBER = {
  'view-all': {
    resource: `${RESOURCE_NAME}*`,
    scopes: ['view-all'],
    allowedRoles: ['admin'],
  },
};

export class MemberController {
  constructor(
    @repository(MemberRepository)
    public memberRepository: MemberRepository,
    @inject(UserServiceBindings.USER_SERVICE)
    public memberManagementService: MemberManagementService,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<Member, Credentials>,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) {}

  /**
   * Create Member
   *
   * @param newUserRequest
   * @returns
   */
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

  @authenticate('jwt')
  @authorize(ACL_MEMBER['view-all'])
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

  /**
   * Login member
   *
   * @param credentials
   * @returns
   */
  @post('/members/login')
  @response(200, {
    description: 'Token',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const member = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const memberProfile = this.userService.convertToUserProfile(member);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(memberProfile);
    return {token};
  }

  /**
   * Update password
   *
   * @param currentUserProfile
   * @param credentials
   * @returns
   */
  @authenticate('jwt')
  @post('/members/forgot-password')
  @response(200, {
    description: '',
    content: {
      'application/json': {
        schema: MemberProfileSchema,
      },
    },
  })
  async forgotPassword(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody(PasswordResetRequestBody) credentials: Credentials,
  ): Promise<{token: string}> {
    const {email, password} = credentials;

    const {id} = currentUserProfile;
    const member = await this.memberRepository.findById(id);

    if (!member) {
      throw new HttpErrors.NotFound('User account not found');
    }

    if (email !== member.email) {
      throw new HttpErrors.Forbidden('Invalid email address');
    }

    const passwordHash = await this.passwordHasher.hashPassword(password);

    await this.memberRepository
      .memberCredentials(member.id)
      .patch({password: passwordHash});

    const memberProfile = this.userService.convertToUserProfile(member);

    const token = await this.jwtService.generateToken(memberProfile);

    return {token};
  }
}
