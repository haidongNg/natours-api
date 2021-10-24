import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  AuthorizationRequest,
  Authorizer,
} from '@loopback/authorization';
import {inject, Provider} from '@loopback/core';
import * as casbin from 'casbin';

const DEFAULT_SCOPE = 'execute';

// Class level authorizer
export class CasbinAuthorizationProvider implements Provider<Authorizer> {
  constructor(
    @inject('casbin.enforcer.factory')
    private enforcerFactory: (name: string) => Promise<casbin.Enforcer>,
  ) {}

  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    // const subject = this.getUserName(authorizationCtx.principals[0].id);
    const subject = authorizationCtx.principals[0].roles;
    // const resourceId = await authorizationCtx.invocationContext.get(
    //   RESOURCE_ID,
    //   {optional: true},
    // );
    // const object = resourceId ?? metadata.resource ?? authorizationCtx.resource;

    const object = metadata.resource ?? authorizationCtx.resource;

    const allowedRoles = metadata.allowedRoles;

    const request: AuthorizationRequest = {
      subject,
      object,
      action: metadata.scopes?.[0] ?? DEFAULT_SCOPE,
    };

    if (!allowedRoles) return AuthorizationDecision.ALLOW;
    if (allowedRoles.length < 1) return AuthorizationDecision.DENY;

    let allow = false;

    // An optimization for ONLY searching among the allowed roles' policies
    for (const role of allowedRoles) {
      const enforcer = await this.enforcerFactory(role);

      const allowedByRole = await enforcer.enforce(
        request.subject,
        request.object,
        request.action,
      );

      if (allowedByRole) {
        allow = true;
        break;
      }
    }

    if (allow) return AuthorizationDecision.ALLOW;
    else if (allow === false) return AuthorizationDecision.DENY;

    return AuthorizationDecision.ABSTAIN;
  }

  // Generate the user name according to the naming convention
  // in casbin policy
  // A user's name would be `u${id}`
  getUserName(id: number | string): string {
    return `u${id}`;
  }
}
