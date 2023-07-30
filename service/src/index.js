const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const generateImage = require("./generate-image");
const { constants } = require("./constants");
const Sentry = require("@sentry/node");

const app = express();

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
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!,
});

app.use(morgan("dev"));

const customTheme = {};

app.use(cors());
app.use(express.json());

// Trace incoming requests
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

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
  try {
    const { code, title, parser } = req.body;

    if (!code || !title || !parser) {
      return res.status(400).json({
        error:
          'Bad request! Empty code, title or parser. { code: "", title: "", parser: "" }, or missing properties.',
      });
    }

    const imageId = Date.now();
    const generatedImageId = await generateImage(
      imageId,
      code,
      title,
      parser,
      customTheme
    );

    res.status(200).json(generatedImageId);
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: "Failed to generate image." });
  }
});

app.get("/v1/image", (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Precisa enviar o code da imagem. ?code=id");
  }

  const imagePath = path.join(
    __dirname,
    "images",
    `source_code_image-${code}.jpg`
  );

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      res.status(500).send("Internal Server Error" + err.message);
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
  console.log(`API server listening on port ${constants.port}`);
});
