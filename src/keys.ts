import {UserService} from '@loopback/authentication';
import {BindingKey} from '@loopback/context';
import {Member} from './models';
import {Credentials} from './repositories';
import {JwtService} from './services';
import {PasswordHasher} from './services/hash.password.bcryptjs';

export namespace UserServiceBindings {
  export const USER_SERVICE = BindingKey.create<
    UserService<Member, Credentials>
  >('services.user.service');
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER =
    BindingKey.create<PasswordHasher>('services.hasher');
  export const ROUNDS = BindingKey.create<number>('services.hasher.round');
}

export namespace JWTAuthenticationStrategyBindings {
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<JwtService>(
    'services.authentication.jwt.tokenservice',
  );
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
}

export const RESOURCE_ID = BindingKey.create<string>('resourceId');
