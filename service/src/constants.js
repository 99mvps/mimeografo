const constants = {
  port: process.env.PORT ?? 8080,
  sentryDNS: process.env.SENTRY_DNS,
};

constants.apiURL = process.env.BASE_URL ?? `http://localhost:${constants.port}`;

module.exports = { constants };
