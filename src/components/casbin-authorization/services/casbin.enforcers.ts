import * as casbin from 'casbin';
import path from 'path';
const POLICY_PATHS = {
  admin: './../../../../casbin/rbac_policy.admin.csv',
  owner: './../../../../casbin/rbac_policy.owner.csv',
  team: './../../../../casbin/rbac_policy.team_member.csv',
};

export async function getCasbinEnforcerByName(
  name: string,
): Promise<casbin.Enforcer | undefined> {
  const CASBIN_ENFORCERS: {[key: string]: Promise<casbin.Enforcer>} = {
    admin: createEnforcerByRole(POLICY_PATHS.admin),
    owner: createEnforcerByRole(POLICY_PATHS.owner),
    team: createEnforcerByRole(POLICY_PATHS.team),
  };

  if (Object.prototype.hasOwnProperty.call(CASBIN_ENFORCERS, name))
    return CASBIN_ENFORCERS[name];

  return undefined;
}

export async function createEnforcerByRole(
  policyPath: string,
): Promise<casbin.Enforcer> {
  const conf = path.resolve(__dirname, './../../../../casbin/rbac_model.conf');
  const policy = path.resolve(__dirname, policyPath);
  return casbin.newEnforcer(conf, policy);
}
