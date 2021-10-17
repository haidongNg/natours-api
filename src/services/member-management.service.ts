import {UserService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {Member} from '../models';
import {Credentials, MemberRepository} from '../repositories';

export class MemberManagementService
  implements UserService<Member, Credentials>
{
  constructor(
    @repository(MemberRepository) public memberRepository: MemberRepository,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<Member> {
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

  convertToUserProfile(member: Member): UserProfile {
    // since first name and lastName are optional, no error is thrown if not provided
    return {
      [securityId]: String(member.id),
      name: member.name,
      id: member.id,
    };
  }
}
