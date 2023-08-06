const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');
// eslint-disable-next-line
const prettier = require('prettier');
const { constants } = require('./constants');
const defaultParser = require('./parsers-default');

const fontPath = path.join(__dirname, 'fonts', 'FiraCode_regular.ttf');
registerFont(fontPath, { family: 'FireCode' });

function drawCloseIcon(sourceCtx, canvasWidth, padding) {
  const closeButtonSize = 20;
  const closeIconX = canvasWidth - padding - closeButtonSize / 2;
  const closeIconY = padding + closeButtonSize / 2;

  // Draw a button-like shape
  sourceCtx.beginPath();
  sourceCtx.arc(closeIconX, closeIconY, closeButtonSize / 2, 0, 2 * Math.PI);
  sourceCtx.fillStyle = '#DDD';
  sourceCtx.fill();
  sourceCtx.strokeStyle = '#000';
  sourceCtx.lineWidth = 1.5;
  sourceCtx.stroke();

  // Draw an X icon
  const iconSize = closeButtonSize * 0.6;
  sourceCtx.fillStyle = '#000';
  sourceCtx.font = `${iconSize}px sans-serif`;
  sourceCtx.textAlign = 'center';
  sourceCtx.textBaseline = 'middle';
  sourceCtx.fillText('X', closeIconX, closeIconY);
}

function drawTitle(sourceCtx, canvasWidth, font, topBarHeight, title) {
  console.log({title})
    sourceCtx.fillStyle = '#000';
    sourceCtx.textAlign = 'center';
    sourceCtx.textBaseline = 'middle';
    sourceCtx.font = font;
    sourceCtx.fillText(title || 'Sem Título1', canvasWidth / 2, topBarHeight / 2);
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function mimeografo(codeId, code, title, parser, color, customTheme = {}) {
  const IMAGE_SERVER_PATH = `images/source_code_image-${codeId}.png`;
  const {
    bgColor = '#272822',
    textColor = '#F8F8F2',
    lineNumberColor = '#75715E',
  } = customTheme;

  let selectedParser = defaultParser(parser);
  const jsParsersList = [
    'babel',
    'typescript',
    'javascipt',
    'babel-flo',
    'babel-t',
    'vue',
    'angular',
  ];

  if (jsParsersList.includes(parser)) {
    selectedParser = {
      ...selectedParser,
      trailingComma: 'es5',
      tabWidth: 2,
      semi: true,
      singleQuote: false,
    };
  }
  // Format the code using prettier
  const formattedCode = await prettier.format(code, selectedParser);

  const fontHeight = 18;
  const lineSpacing = 22;
  const padding = 5;
  const closeButtonSize = 20;
  const topBarHeight = 30;

  const lines = formattedCode.split('\n');
  const lineCount = lines.length;

  // Calculate the width and height of the canvas based on the longest line and line count
  const longestLine = lines.reduce(
    (max, line) => Math.max(max, line.length),
    0,
  );

  // Calculate canvas dimensions to accommodate code, border, and close icon
  const lineNumberWidth = Math.max(
    (lineCount + 1).toString().length * fontHeight * 0.6,
    50,
  );
  const canvasWidth = lineNumberWidth
    + longestLine * (fontHeight * 0.6)
    + padding * 4
    + closeButtonSize;

  const canvasHeight = lineCount * lineSpacing + padding * 2 + topBarHeight + fontHeight;

  // Create the initial canvas with the source code image
  const sourceCanvas = createCanvas(canvasWidth, canvasHeight);
  const sourceCtx = sourceCanvas.getContext('2d');

  // Set background color based on the theme
  sourceCtx.fillStyle = bgColor;
  sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  // Set code text properties based on the theme with fixed font size
  sourceCtx.font = `${fontHeight}px Monospace`;
  sourceCtx.fillStyle = textColor;

  // Draw the source code and line numbers
  // Start Y position for the first line number
  let lineNumberY = topBarHeight + padding + fontHeight;

  for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
    // Draw line number with color based on the theme
    sourceCtx.fillStyle = lineNumberColor;
    sourceCtx.fillText(lineNumber.toString(), padding * 2, lineNumberY);

    // Draw code line with color based on the theme
    sourceCtx.fillStyle = textColor;
    sourceCtx.fillText(
      lines[lineNumber - 1],
      padding * 3 + lineNumberWidth,
      lineNumberY,
    );

    // Increment Y position for the next line
    lineNumberY += lineSpacing;
  }

  sourceCtx.strokeStyle = '#000';
  sourceCtx.lineWidth = 5;
  sourceCtx.strokeRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  sourceCtx.fillStyle = '#ccc';
  sourceCtx.fillRect(0, 0, sourceCanvas.width, topBarHeight);

  drawCloseIcon(sourceCtx, canvasWidth, padding);

  drawTitle(
    sourceCtx,
    canvasWidth,
    `bold ${fontHeight}px FiraCode`,
    topBarHeight,
    title,
  );

  // Create a new canvas with the final dimensions including the border and close icon
  const targetCanvas = createCanvas(sourceCanvas.width * 1.25, sourceCanvas.height + 145 * 1.25);
  const targetCtx = targetCanvas.getContext('2d');
  targetCtx.fillStyle = color ? `#${color}` : getRandomColor();

  targetCtx.fillRect(0, 0, sourceCanvas.width * 1.25, sourceCanvas.height + 145 * 1.25);

  const footnoteText = 'https://mimeografo.codes';
  const footnoteTextX = targetCanvas.width - targetCtx.measureText(footnoteText).width - 220;
  const footnoteTextY = targetCanvas.height - 45;

  targetCtx.fillStyle = ['FC8179', '1293C5', '5C30BD'].includes(color) ? '#fff' : '#000'; // Set the text color to black
  targetCtx.font = `${fontHeight}px Monospace`;
  targetCtx.fillText(footnoteText, footnoteTextX, footnoteTextY);

  const x = (targetCanvas.width - sourceCanvas.width) * 0.5;
  const y = (targetCanvas.height - sourceCanvas.height) * 0.5;
  // Draw the source code image onto the target canvas
  targetCtx.drawImage(sourceCanvas, x, y);

  const imageSourcePath = path.join(__dirname, IMAGE_SERVER_PATH);
  // Save the image to a file
  const out = fs.createWriteStream(imageSourcePath);

  const stream = targetCanvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve) => {
    out.on('finish', () => {
      const imageBuffer = fs.readFileSync(imageSourcePath);
      const base64 = imageBuffer.toString('base64');
      console.log('MIMEOGRAFO CRIADO', {
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
