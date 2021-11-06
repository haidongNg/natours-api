import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import _ from 'lodash';
import {SentMessageInfo} from 'nodemailer';
import {v4 as uuidv4} from 'uuid';
import {PasswordHasherBindings} from '../keys';
import {Member, MemberWithPassword} from '../models';
import {Credentials, MemberRepository} from '../repositories';
import {subtractDates} from '../utils';
import {EmailService} from './email.service';
import {PasswordHasher} from './hash.password.bcryptjs';

export class MemberManagementService
  implements UserService<Member, Credentials>
{
  constructor(
    @repository(MemberRepository) public memberRepository: MemberRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject('services.EmailService') public emailService: EmailService,
  ) {}

  /**
   * Check Login
   *
   * @param credentials
   * @returns
   */
  async verifyCredentials(credentials: Credentials): Promise<Member> {
    const {email, password} = credentials;
    const invalidCredentialsError = 'Invalid email or password.';

    // Check email
    if (!email) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    const foundUser = await this.memberRepository.findOne({
      where: {email, active: true},
    });

    // Check user
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    // Check password
    const credentialsFound = await this.memberRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    // Compare password
    const passwordMatched = await this.passwordHasher.comparePassword(
      password,
      credentialsFound.password,
    );

    if (!passwordMatched) {
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
    // since first name and lastName are optional, no error is thrown if not provided
    let userName = '';
    if (member.firstName) userName = `${member.firstName}`;
    if (member.lastName)
      userName = member.firstName
        ? `${userName} ${member.lastName}`
        : `${member.lastName}`;
    return {
      [securityId]: String(member.id),
      name: userName,
      id: member.id,
      roles: member.roles,
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

  /**
   * Reset password and send mail
   *
   * @param email string
   * @returns
   */
  async requestPasswordReset(email: string): Promise<SentMessageInfo> {
    const noAccountFoundError =
      'No account associated with the provided email address.';
    const foundUser = await this.memberRepository.findOne({
      where: {email},
    });

    if (!foundUser) {
      throw new HttpErrors.NotFound(noAccountFoundError);
    }

    const member = await this.updateResetRequestLimit(foundUser);

    try {
      await this.memberRepository.updateById(member.id, member);
    } catch (e) {
      return e;
    }
    return this.emailService.sendResetPasswordMail(member);
  }

  /**
   * Checks user reset timestamp if its same day increase count
   * otherwise set current date as timestamp and start counting
   * For first time reset request set reset count to 1 and assign same day timestamp
   * @param user
   */
  async updateResetRequestLimit(member: Member): Promise<Member> {
    const resetTimestampDate = new Date(member.resetKeyTimestamp);

    const difference = await subtractDates(resetTimestampDate);

    if (difference === 0) {
      member.resetCount = member.resetCount + 1;

      if (member.resetCount > +(process.env.PASSWORD_RESET_EMAIL_LIMIT ?? 2)) {
        throw new HttpErrors.TooManyRequests(
          'Account has reached daily limit for sending password-reset requests',
        );
      }
    } else {
      member.resetTimestamp = new Date().toLocaleDateString();
      member.resetCount = 1;
    }

    // For generating unique reset key there are other options besides the proposed solution below.
    // Feel free to use whatever option works best for your needs
    member.resetKey = uuidv4();
    member.resetKeyTimestamp = new Date().toLocaleDateString();

    return member;
  }

  /**
   * Ensures reset key is only valid for a day
   * @param member
   */
  async validateResetKeyLifeSpan(member: Member): Promise<Member> {
    const resetKeyLifeSpan = new Date(member.resetKeyTimestamp);
    const difference = await subtractDates(resetKeyLifeSpan);

    member.resetKey = '';
    member.resetKeyTimestamp = '';

    if (difference !== 0) {
      throw new HttpErrors.BadRequest('The provided reset key has expired.');
    }

    return member;
  }
}
