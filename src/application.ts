import {
  AuthenticationComponent,
  registerAuthenticationStrategy,
} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  TokenServiceBindings,
} from '@loopback/authentication-jwt';
import {AuthorizationComponent} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import ms from 'ms';
import path from 'path';
import {CasbinAuthorizationComponent} from './components/casbin-authorization';
import {PasswordHasherBindings, UserServiceBindings} from './keys';
import {MySequence} from './sequence';
import {
  JWTAuthenticationStrategy,
  JwtService,
  MemberManagementService,
} from './services';
import {BcryptHasher} from './services/hash.password.bcryptjs';

export {ApplicationConfig};

export class NatourApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    dotenv.config();
    // Bind authentication component related elements
    // Mount authentication system
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);

    // Mount jwt component
    this.component(JWTAuthenticationComponent);
    // register your custom authentication strategy
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);
    this.component(CasbinAuthorizationComponent);
    this.setUpBindings();

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  setUpBindings(): void {
    // Bind bcrypt hash services
    this.bind(PasswordHasherBindings.ROUNDS).to(12);
    this.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);

    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JwtService);

    this.bind(UserServiceBindings.USER_SERVICE).toClass(
      MemberManagementService,
    );

    // this.add(createBindingFromClass(SecuritySpecEnhancer));

    // Use JWT secret from JWT_SECRET environment variable if set
    // otherwise create a random string of 64 hex digits
    const secret = process.env.JWT_SECRET ?? crypto.randomBytes(32).toString();
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(secret);
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(ms(7200000));
  }
}
