const constants = {
  port: process.env.PORT ?? 3000,
};

constants.apiURL = process.env.API_URL ?? 'http://localhost:8080';

module.exports = { constants };
