const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { constants } = require('./constants');

const app = express();

app.use(morgan('dev'));

app.use(cors());
app.use(express.json());

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// eslint-disable-next-line
morgan.token('body', (req, _) => JSON.stringify(req.body));

app.use(
  morgan(
    ':status :method :response-time ms - :res[content-length] :body - :req[content-length]',
  ),
);

app.get('/health', async (req, res) => {
  const ping = Date.now();
  const apiURL = new URL('/health', constants.apiURL);
  apiURL.searchParams.append('ping', ping);
  fetch(apiURL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((_) => _.json())
    .then((response) => {
      if (Number(response.serverChallengeResponse) !== Number(ping)) {
        return res.status(500).json({
          status: 'nok',
          externalService: 'unavailable',
          timestamp: Date.now(),
          version: '1.0.0',
          message: 'Tu tá se achando o Mr Robot, né?',
        });
      }

      return res.status(200).json({
        status: 'ok',
        externalService: 'available',
        timestamp: Date.now(),
        version: '1.0.0',
      });
    })
    .catch((error) => res.status(500).json({
      status: 'dead-server',
      externalService: `unavailable: ${error.message}`,
      timestamp: Date.now(),
      version: '1.0.0',
    }));
});

app.listen(constants.port, () => {
  console.log(`API server listening on port ${constants.port}`);
});
