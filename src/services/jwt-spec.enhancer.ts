// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: loopback4-example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {bind} from '@loopback/core';
import {
  asSpecEnhancer,
  mergeOpenAPISpec,
  OASEnhancer,
  OpenApiSpec,
} from '@loopback/rest';
import debugModule from 'debug';
import {inspect} from 'util';
import {SECURITY_SCHEME_SPEC} from '../utils';
const debug = debugModule('loopback:jwt-extension:spec-enhancer');

/**
 * A spec enhancer to add bearer token OpenAPI security entry to
 * `spec.component.securitySchemes`
 */
@bind(asSpecEnhancer)
export class SecuritySpecEnhancer implements OASEnhancer {
  name = 'bearerAuth';

  modifySpec(spec: OpenApiSpec): OpenApiSpec {
    const patchSpec = {
      components: {
        securitySchemes: SECURITY_SCHEME_SPEC,
      },
      security: [],
    };
    const mergedSpec = mergeOpenAPISpec(spec, patchSpec);
    debug(`security spec extension, merged spec: ${inspect(mergedSpec)}`);
    return mergedSpec;
  }
}
