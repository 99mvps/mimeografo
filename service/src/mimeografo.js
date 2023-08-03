const fs = require("fs");
const path = require("path");
const { createCanvas, registerFont } = require("canvas");
const prettier = require("prettier");
const { constants } = require("./constants");
const defaultParser = require("./parsers-default");

const fontPath = path.join(__dirname, "fonts", "FiraCode_regular.ttf");
registerFont(fontPath, { family: "FireCode" });

async function mimeografo(codeId, code, title, parser, customTheme = {}) {
  const IMAGE_SERVER_PATH = `images/source_code_image-${codeId}.png`;
  const {
    bgColor = "#272822",
    textColor = "#F8F8F2",
    lineNumberColor = "#75715E",
  } = customTheme;

  let selectedParser = defaultParser(parser);
  const jsParsersList = [
    "babel",
    "typescript",
    "javascipt",
    "babel-flo",
    "babel-t",
    "vue",
    "angular",
  ];

  if (jsParsersList.includes(parser)) {
    selectedParser = {
      ...selectedParser,
      trailingComma: "es5",
      tabWidth: 2,
      semi: true,
      singleQuote: false,
    };
  }
  // Format the code using prettier
  const formattedCode = await prettier.format(code, selectedParser);

  const lines = formattedCode.split("\n");

  // Calculate the width and height of the canvas based on the longest line and line count
  const longestLine = lines.reduce(
    (max, line) => Math.max(max, line.length),
    0
  );
  const lineCount = lines.length;
  const fontHeight = 18;
  const lineSpacing = 22;
  const padding = 5;
  const closeButtonSize = 20;
  const topBarHeight = 30;

  // Calculate canvas dimensions to accommodate code, border, and close icon
  const lineNumberWidth = Math.max(
    (lineCount + 1).toString().length * fontHeight * 0.6,
    50
  );
  const canvasWidth =
    lineNumberWidth +
    longestLine * (fontHeight * 0.6) +
    padding * 4 +
    closeButtonSize;
  const canvasHeight =
    lineCount * lineSpacing + padding * 2 + topBarHeight + fontHeight;

  // Create the initial canvas with the source code image
  const sourceCanvas = createCanvas(canvasWidth, canvasHeight);
  const sourceCtx = sourceCanvas.getContext("2d");

  // Set background color based on the theme
  sourceCtx.fillStyle = bgColor;
  sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  // Set code text properties based on the theme with fixed font size
  sourceCtx.font = `${fontHeight}px Monospace`;
  sourceCtx.fillStyle = textColor;

  // Draw the source code and line numbers
  let lineNumberY = topBarHeight + padding + fontHeight; // Start Y position for the first line number

  for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
    // Draw line number with color based on the theme
    sourceCtx.fillStyle = lineNumberColor;
    sourceCtx.fillText(lineNumber.toString(), padding * 2, lineNumberY);

    // Draw code line with color based on the theme
    sourceCtx.fillStyle = textColor;
    sourceCtx.fillText(
      lines[lineNumber - 1],
      padding * 3 + lineNumberWidth,
      lineNumberY
    );

    // Increment Y position for the next line
    lineNumberY += lineSpacing;
  }

  // Draw the border
  sourceCtx.strokeStyle = "#000"; // Border color
  sourceCtx.lineWidth = 5;
  sourceCtx.strokeRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  // Draw the top bar
  sourceCtx.fillStyle = "#ccc"; // Gray color for the top bar
  sourceCtx.fillRect(0, 0, sourceCanvas.width, topBarHeight);

  // Draw the close icon (X symbol)
  const closeIconSize = 12;
  const closeIconX =
    canvasWidth - padding - closeButtonSize + closeIconSize / 2;
  const closeIconY = padding + closeIconSize / 2;
  sourceCtx.fillStyle = "#000"; // Black color for the close icon
  sourceCtx.textAlign = "center";
  sourceCtx.textBaseline = "middle";
  sourceCtx.font = `bold ${closeIconSize}px FiraCode`;
  sourceCtx.fillText("X", closeIconX, closeIconY);

  // Draw the title
  sourceCtx.fillStyle = "#000"; // Black color for the title
  sourceCtx.textAlign = "center";
  sourceCtx.textBaseline = "middle";
  sourceCtx.font = `bold ${fontHeight}px FiraCode`;
  sourceCtx.fillText(title, canvasWidth / 2, topBarHeight / 2);

  // Create a new canvas with the final dimensions including the border and close icon
  const targetCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const targetCtx = targetCanvas.getContext("2d");

  // Draw the source code image onto the target canvas
  targetCtx.drawImage(sourceCanvas, 0, 0);

  const imageSourcePath = path.join(__dirname, IMAGE_SERVER_PATH);
  // Save the image to a file
  const out = fs.createWriteStream(imageSourcePath);

  const stream = targetCanvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve) => {
    out.on("finish", () => {
      const imageBuffer = fs.readFileSync(imageSourcePath);
      const base64 = imageBuffer.toString("base64");
      console.log("MIMEOGRAFO CRIADO", {
        codeId,
        code,
        title,
        base64: base64.substring(0, 80),
        imageURI: `${constants.apiURL}/${IMAGE_SERVER_PATH}`,
      });
      resolve({
        codeId,
        code,
        title,
        base64,
        imageURI: `${constants.apiURL}/${IMAGE_SERVER_PATH}`,
      });
    });
  });
}

module.exports = mimeografo;
