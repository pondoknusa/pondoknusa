export default {
  defaults: { guard: 'api' },
  oauth: {
    providers: {
      github: {
        clientId: 'x',
        clientSecret: 'y',
        redirectUri: 'http://localhost/api/v1/auth/github/callback',
      },
      google: {
        clientId: 'x',
        clientSecret: 'y',
        redirectUri: 'http://localhost/auth/google/callback',
      },
    },
  },
};
