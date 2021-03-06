import {AuthorizationTags} from '@loopback/authorization';
import {Binding, Component} from '@loopback/core';
import {CasbinAuthorizationProvider, getCasbinEnforcerByName} from './services';

export class CasbinAuthorizationComponent implements Component {
  // Set up `bindings`
  bindings: Binding[] = [
    Binding.bind('casbin.enforcer.factory').to(getCasbinEnforcerByName),
    Binding.bind('authorizationProviders.casbin-provider')
      .toProvider(CasbinAuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER),
  ];
}
