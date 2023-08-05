const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const mimeografo = require("./mimeografo");
const { constants } = require("./constants");
const Sentry = require("@sentry/node");
const crypto = require("crypto");
const cron = require("node-cron");

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

app.use(morgan("dev"));

app.use(
  cors({
    origin: "https://mimeografo.codes",
  })
);
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "images")));

morgan.token("body", (req, res) => JSON.stringify(req.body));

app.use(
  morgan(
    ":status :method :response-time ms - :res[content-length] :body - :req[content-length]"
  )
);

app.get("/", (req, res) => {
  res.status(200).json({ error: true, users: [] });
});

app.get("/health", async (req, res) => {
  const ping = req.query.ping;
  res.status(200).json({
    status: "ok",
    serverChallengeResponse: ping,
    timestamp: Date.now(),
    version: "1.0.0",
  });
});

app.post("/v1/code", async (req, res) => {
  const codeId = crypto.randomBytes(16).toString("hex");
  const { code, title, parser } = req.body;

  if (!code || parser === "Selecione um parser") {
    Sentry.captureMessage("PARSER_NOT_SELECTED");
    return res.status(400).json({
      error: "Deu ruim! Precisa preencher os campos code, title ou parser.",
    });
  }

  try {
    const mime = await mimeografo(codeId, code, title, parser, customTheme);

    res.status(200).json(mime);
  } catch (err) {
    Sentry.captureException(err);
    if (
      err.message ===
      "No parser and no file path given, couldn't infer a parser."
    ) {
      return res.status(400).json({
        error: "Deu ruim! Precisa preencher os campos code, title ou parser.",
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
});

app.get("/v1/image", (req, res) => {
  const { code } = req.query;

  if (!code) {
    Sentry.captureMessage("CODE_NOT_SENT");
    return res
      .status(400)
      .send("Precisa enviar o code da imagem. /v1/image?code=code_id");
  }

  const imagePath = path.join(
    __dirname,
    "images",
    `source_code_image-${code}.png`
  );

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      Sentry.captureException(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(data);
    }
  });
});

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.listen(constants.port, () => {
  // Cron job to delete images every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    fs.readdir(`${__dirname}/images`, (err, files) => {
      if (err) {
        console.error("Error reading images directory:", err);
        return;
      }

      files.forEach((file) => {
        const imageFilePath = path.join(__dirname, "/images", file);
        fs.unlink(imageFilePath, (err) => {
          if (err) {
            console.error("Error deleting image:", err);
          } else {
            console.log("Image file has been deleted:", imageFilePath);
          }
        });
      });
    });
  });
  console.log(`API server listening on port ${constants.port}`);
});
