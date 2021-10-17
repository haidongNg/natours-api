import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import _ from 'lodash';
import {PasswordHasherBindings} from '../keys';
import {Member, MemberWithPassword} from '../models';
import {Credentials, MemberRepository} from '../repositories';
import {PasswordHasher} from './hash.password.bcryptjs';

export class MemberManagementService
  implements UserService<Member, Credentials>
{
  constructor(
    @repository(MemberRepository) public memberRepository: MemberRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<Member> {
    // TODO
    const {email} = credentials;
    const invalidCredentialsError = 'Invalid email or password.';
    if (!email) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    const foundUser = await this.memberRepository.findOne({
      where: {email},
    });
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  /**
   * Get user profile
   *
   * @param member Member
   * @returns
   */
  convertToUserProfile(member: Member): UserProfile {
    // TODO
    // since first name and lastName are optional, no error is thrown if not provided
    return {
      [securityId]: String(member.id),
      name: member.name,
      id: member.id,
    };
  }

  /**
   * Create Member
   *
   * @param memberWithPassword Request
   * @returns Member
   */
  async createMember(memberWithPassword: MemberWithPassword): Promise<Member> {
    // hash password
    const password = await this.passwordHasher.hashPassword(
      memberWithPassword.password,
    );

    memberWithPassword.password = password;

    // create Member
    const member = await this.memberRepository.create(
      _.omit(memberWithPassword, 'password'),
    );

    // created MemberCredentials
    await this.memberRepository
      .memberCredentials(member.id)
      .create({password: memberWithPassword.password});
    return member;
  }
}
