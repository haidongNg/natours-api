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
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import isemail from 'isemail';
import _ from 'lodash';
import {SentMessageInfo} from 'nodemailer';
import {PasswordHasherBindings} from '../keys';
import {KeyAndPassword, Member, ResetPasswordInit} from '../models';
import {Credentials, MemberRepository} from '../repositories';
import {
  MemberManagementService,
  validateCredentials,
  validateKeyPassword,
} from '../services';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {funcFilterObj} from '../utils';
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

// TODO
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
    // All new users have the "customer" role by default
    newUserRequest.roles = ['customer'];

    // ensure a valid email value and password value
    validateCredentials(_.pick(newUserRequest, ['email', 'password']));

    newUserRequest.resetKey = '';
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

  /**
   * Update me
   *
   * @param id
   * @param member
   */
  @authenticate('jwt')
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
    // Get member from db
    const updateMember = await this.memberRepository.findById(id);

    // Check exists
    if (!updateMember) {
      throw new HttpErrors.NotFound('User account not found');
    }

    // Fields out unwated fields names that are not allowed to be updated
    const fieldMember = funcFilterObj(member, 'name');
    await this.memberRepository.updateById(id, fieldMember);
  }

  /**
   * Delete member
   *
   * @param id
   */
  @authenticate('jwt')
  @del('/members/{id}')
  @response(204, {
    description: 'Member DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const foundMember = await this.memberRepository.findById(id);
    if (!foundMember) {
      throw new HttpErrors.NotFound('User account not found');
    }
    await this.memberRepository.updateById(id, {active: false});
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

    // Get member from db
    const member = await this.memberRepository.findById(id);

    if (!member) {
      throw new HttpErrors.NotFound('User account not found');
    }

    if (email !== member.email) {
      throw new HttpErrors.Forbidden('Invalid email address');
    }

    // Valicate email and password
    validateCredentials(_.pick(credentials, ['email', 'password']));

    // password hasher
    const passwordHash = await this.passwordHasher.hashPassword(password);

    // Update password
    await this.memberRepository
      .memberCredentials(member.id)
      .patch({password: passwordHash});

    // Convert member
    const memberProfile = this.userService.convertToUserProfile(member);

    // Create send token
    const token = await this.jwtService.generateToken(memberProfile);

    return {token};
  }

  @post('members/reset-password/init')
  @response(200, {
    description: 'Confirmation that reset password email has been sent',
  })
  async resetPasswordInit(
    @requestBody() resetPasswordInit: ResetPasswordInit,
  ): Promise<string> {
    if (!isemail.validate(resetPasswordInit.email)) {
      throw new HttpErrors.UnprocessableEntity('Invalid email address');
    }

    const sentMessageInfo: SentMessageInfo =
      await this.memberManagementService.requestPasswordReset(
        resetPasswordInit.email,
      );

    if (sentMessageInfo.accepted.length) {
      return 'Successfully sent reset password link';
    }

    throw new HttpErrors.InternalServerError(
      'Error sending reset password email',
    );
  }

  @put('/members/reset-password/finish')
  @response(200, {
    description: 'A successful password reset response',
  })
  async resetPasswordFinish(
    @requestBody() keyAndPassword: KeyAndPassword,
  ): Promise<string> {
    // Validator
    validateKeyPassword(keyAndPassword);

    // Get resetkey from db
    const foundMember = await this.memberRepository.findOne({
      where: {resetKey: keyAndPassword.resetKey},
    });

    if (!foundMember) {
      throw new HttpErrors.NotFound(
        'No associated account for the provided reset key',
      );
    }

    // Check validate resetKey life span
    const user = await this.memberManagementService.validateResetKeyLifeSpan(
      foundMember,
    );

    // Password hasher
    const passwordHash = await this.passwordHasher.hashPassword(
      keyAndPassword.password,
    );

    // update password
    try {
      await this.memberRepository
        .memberCredentials(user.id)
        .patch({password: passwordHash});

      await this.memberRepository.updateById(user.id, user);
    } catch (e) {
      return e;
    }

    return 'Password reset successful';
  }
}
