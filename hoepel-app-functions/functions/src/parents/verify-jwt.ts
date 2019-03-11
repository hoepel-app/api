import * as jwt from 'jsonwebtoken';

const jwtTokens = [
  '-----BEGIN CERTIFICATE-----\nMIIDHDCCAgSgAwIBAgIINufXMaVT/PswDQYJKoZIhvcNAQEFBQAwMTEvMC0GA1UE\nAxMmc2VjdXJldG9rZW4uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wHhcNMTkw\nMzAxMjEyMDQ4WhcNMTkwMzE4MDkzNTQ4WjAxMS8wLQYDVQQDEyZzZWN1cmV0b2tl\nbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTCCASIwDQYJKoZIhvcNAQEBBQAD\nggEPADCCAQoCggEBAJ2waYXBqlW4+tHqgbXl8iatiaeywHPE8RWwUCGH/hBD86eR\nb5c6IS0SQpawOajCeMIxci4JGeiwwwQcxpdm+1Z+ysu1dh9uhkKhDimCyHFMfqfu\nkfekRrNGnXqzyGS8r+1BPYjlm2VdP7v8AOhphAsXb4WDo+unzFqq+kMw1qJ0UQUh\nNM8fr8Mj55nQZhQpxCVki29FR57rgYz1WCOF90Uue+WNuhPEPUVPGIbWOXlOai1W\nYxqg0+5IMO26ssZZe6DWHcJEth1EenJCzpjk7Y7rFRCI4u2bSIYTiG3xz1/lK7v/\nwF5rNrJlMsURzoKX7oneGAM7WqBMv5U3NoW1qSECAwEAAaM4MDYwDAYDVR0TAQH/\nBAIwADAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwDQYJ\nKoZIhvcNAQEFBQADggEBAIYd/sQ7jkxC8BvoU4vDeg6br/O0BDMHgnZErVM8zoEV\n9KkcfcR8UJ2E82Kx6a4akthrPoIRLdcPXgaW6RYTME35szs9jH3S28JMO0Zz+S4/\nT8Wji0KH3vClX5Va9JXiiPYvSdLthbDIJj5Ph7MWSZ6lvL/8LXySIOmrPkBJ0Bg5\ns0Qi0RAqigKrI27Fb12C10OUVV52h4TgVYSa+NCfnqUXVOwbg4l8cNc/byD4gNaB\nIebzkkruzD768UuDsjq/WG+jrC78SUOl1u5uYypgKROofnFZYWv9yXg4Mooyn/DX\n7xVDbUna6NPuv/Qyjhph5zan5oDVIVob/UpjLTsaSpw=\n-----END CERTIFICATE-----\n',
  '-----BEGIN CERTIFICATE-----\nMIIDHDCCAgSgAwIBAgIIaIdZHcdRq3wwDQYJKoZIhvcNAQEFBQAwMTEvMC0GA1UE\nAxMmc2VjdXJldG9rZW4uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wHhcNMTkw\nMzA5MjEyMDQ5WhcNMTkwMzI2MDkzNTQ5WjAxMS8wLQYDVQQDEyZzZWN1cmV0b2tl\nbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTCCASIwDQYJKoZIhvcNAQEBBQAD\nggEPADCCAQoCggEBALzG04KTHMRNfb4kxDz1O8aDl7brHp7EkiHIZbzKnomMQvwU\n35Pw+XSpNXGMnLM3YcOPawyxb7ysG6CR88jgvtSn3zai48RVoGcfmk+1wHOlKHNF\nGUjEKkXH04jApqmdEKJPQMdsN9gYeIA8Qtu5fNqlwn7o01xYxMi720br4DMRJ/gA\nbmwQlMJv62X/KX/cWs22PFs7eEL2bsqeWCHLJt0FKStBbey0NK2JDC56uAGv5HpC\nL4M54g+9ADcXm/Rb7t6coRz78pABzwTjhRK88bm9QHPOuJnhu088nOMRExozSYSY\n5QKpren6nS8sVQ6lWk5EVsgeOMuicV2q34DdHLUCAwEAAaM4MDYwDAYDVR0TAQH/\nBAIwADAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwDQYJ\nKoZIhvcNAQEFBQADggEBAJIGoLx/tm2hpm3bexESq0UNAOPHEj/j9nOOy4ZbHYlm\nvson0+LguzCm1KTbWNAPkDKAbcX3CZdNJT5CyhWD/stMy5lUy3VdC2J9mgtY0iI+\n37t6VNpFykhqxMcOn/ihpNYyQXoH+xkC7NkWNBhp/4ZgKeaiXe76PGwoLyb0JvhI\n7bmGGj/WkTwO3p053jqgMo+brPp53PbKuW315eSWsUJxy+0jAVTBvVObRdcQOW+e\nOYMY6X3y0fK4g8WkTVYDsDaP+13eVVmCDW7en2ZG2ZmTPjxMh4vph2ix8jBO48G4\nQaHwjV8HPUcNsjQo1A5EPjHjzt8zWLb5E0/JGLL0iHs=\n-----END CERTIFICATE-----\n'
]; // https://stackoverflow.com/questions/50078588/where-do-i-find-a-key-that-jwt-is-signed-with

const algorithm = 'RS256';
const iss = 'https://securetoken.google.com/speelpleinwerking-com';
const aud = 'speelpleinwerking-com';
// sub = Firebase uid field

/**
 * Verifies that a JWT token is valid for the speelpleinwerking.com project
 */
export const verifyJwt = (token: string): boolean => {
  const errors = [];

  const isValid = jwtTokens.map(cert => {
    try {
      jwt.verify(token, jwtTokens[0], { audience: aud, issuer: iss, algorithms: [ algorithm ] });
      return true;
    } catch (e) {
      errors.push(e);
      return false;
    }
  }).indexOf(true) !== -1;

  if (!isValid) {
    console.error('Invalid token, errors: ', errors);
  }

  return isValid;
}
