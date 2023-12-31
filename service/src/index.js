const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const cron = require('node-cron');
const mimeografo = require('./mimeografo');
const { constants } = require('./constants');

const app = express();
const customTheme = {};

Sentry.init({
  dsn: constants.sentryDNS,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({
      tracing: true,
    }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      app,
    }),
  ],
  debug: true,
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(morgan('dev'));

app.use(cors());

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

// eslint-disable-next-line
morgan.token('body', (req, res) => JSON.stringify(req.body));

app.use(
  morgan(
    ':status :method :response-time ms - :res[content-length] :body - :req[content-length]',
  ),
);

app.get('/', (req, res) => {
  res.status(200).json({ error: true, users: [] });
});

app.get('/health', async (req, res) => {
  const { ping } = req.query;
  res.status(200).json({
    status: 'ok',
    serverChallengeResponse: ping,
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

app.post('/v1/code', async (req, res) => {
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  // res.header('Access-Control-Allow-Headers', 'content-type');

  const codeId = crypto.randomBytes(16).toString('hex');
  const {
    code, title, color, parser,
  } = req.body;

  if (!code || parser === 'Selecione um parser') {
    Sentry.captureMessage('PARSER_NOT_SELECTED');
    return res.status(400).json({
      error: 'Deu ruim! Precisa preencher os campos code, title ou parser.',
    });
  }

  try {
    const mime = await mimeografo(
      codeId,
      code,
      title,
      parser,
      color,
      customTheme,
    );

    res.status(200).json(mime);
  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
    if (
      err.message
      === "No parser and no file path given, couldn't infer a parser."
    ) {
      return res.status(400).json({
        error: 'Deu ruim! Precisa preencher os campos code, title ou parser.',
      });
    }
    res.status(400).json({
      codeId,
      code,
      title,
      parser,
      errorMessage: err.cause.msg,
      errorTrace: err,
    });
  }
  return codeId;
});

app.get('/v1/image', (req, res) => {
  const { code } = req.query;

  if (!code) {
    Sentry.captureMessage('CODE_NOT_SENT');
    return res
      .status(400)
      .send('Precisa enviar o code da imagem. /v1/image?code=code_id');
  }

  const imagePath = path.join(
    __dirname,
    'images',
    `source_code_image-${code}.png`,
  );

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      Sentry.captureException(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(data);
    }
  });

  return code;
});

app.use(Sentry.Handlers.errorHandler());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error!');
  Sentry.captureException(err);
});

app.listen(constants.port, () => {
  // Cron job to delete images every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    fs.readdir(`${__dirname}/images`, (err, files) => {
      if (err) {
        console.error('Error reading images directory:', err);
        return;
      }

      files.forEach((file) => {
        const imageFilePath = path.join(__dirname, '/images', file);
        fs.unlink(imageFilePath, (fsErr) => {
          if (fsErr) {
            console.fsError('fsError deleting image:', fsErr);
          } else {
            console.log('Image file has been deleted:', imageFilePath);
          }
        });
      });
    });
  });
  console.log(`API server listening on port ${constants.port}`);
});
