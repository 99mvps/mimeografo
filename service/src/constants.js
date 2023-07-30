const constants = {
  port: process.env.PORT ?? 8080,
};

constants.apiURL =
  `${process.env.BASE_URL}` ?? `http://localhost:${constants.port}`;

module.exports = { constants };
