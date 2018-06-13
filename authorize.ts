// TODO use TypeScript

/**
  * Authorizer functions are executed before your actual functions.
  * @method authorize
  * @param {String} event.authorizationToken - JWT
  * @throws Returns 401 if the token is invalid or has expired.
  * @throws Returns 403 if the token does not have sufficient permissions.
  */
module.exports.handler = (event, context, callback) => {
  const token = event.authorizationToken;

  const policy = {
    principalId: 'user-id-here',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow', // 'Deny' if not allowed
          Resource: event.methodArn,
        },
      ],
    },
    context: {
      i_guess_i_can_add_whatever_here: true
    },
  };

  callback(null, policy);
};

