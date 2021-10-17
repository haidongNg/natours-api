import {UserService} from '@loopback/authentication';
import {BindingKey} from '@loopback/context';
import {Member} from './models';
import {Credentials} from './repositories';
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
