import { Callback, Context, CustomAuthorizerEvent, Handler } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { buildIAMPolicy } from './build-iam-policy-document';

const getApiOptions = function(event: CustomAuthorizerEvent) {
  const split = event.methodArn.split(':');
  const apiGatewayArn = split[5].split('/');

  return {
    awsAccountId: split[4],
    region: split[3],
    restApiId: apiGatewayArn[0],
    stageName: apiGatewayArn[1],
  };
};

/**
 * Authorizer functions are executed before your actual functions.
 * @param {String} event.authorizationToken - JWT
 * @throws Returns 401 if the token is invalid or has expired.
 * @throws Returns 403 if the token does not have sufficient permissions.
 */
export const authorizeHandler: Handler = (event: CustomAuthorizerEvent, context: Context, callback: Callback) => {
    const pemKey = process.env.AUTH0_PEM_KEY;
    const audience = process.env.AUTH0_AUDIENCE;

    if (!pemKey) {
        throw new Error('AUTH0_PEM_KEY not set')
    }

    if (!audience) {
        throw new Error('AUTH0_AUDIENCE not set')
    }

    console.log('auth event: ', event);

    const token = (event.authorizationToken || '').replace(/Bearer /g, '');
    const apiOptions = getApiOptions(event);

    jwt.verify(token, pemKey, { audience, algorithms: [ 'RS256' ] }, (err, verified: any) => {
        if (err) {
          console.error('JWT Error', err, err.stack);
          callback(null, buildIAMPolicy('anonymous', 'Deny', event.methodArn));
        } else {
          callback(null, buildIAMPolicy(verified.sub, 'Allow', event.methodArn))
        }
    });
};
