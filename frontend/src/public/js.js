const $ = (element) => document.querySelector(element);
const apiURL = 'https://mimeografo-api.fly.dev';

function showToast(options) {
  let timer = 3000;
  let message = '';
  if (options) {
    timer = options.timer ?? timer;
    message = options.message ?? message;
  }

  const toast = $('#toastMessage');
  toast.innerHTML = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.innerHTML = '';
  }, timer);
}

function loaderHandler({ hideElement }) {
  const loaderDisplay = $('#spinner-loader');
  const hiddenElementDisplay = $(hideElement);

  if (loaderDisplay.style.display === 'none') {
    loaderDisplay.style.display = 'block';
  } else {
    loaderDisplay.style.display = 'none';
  }

  if (hiddenElementDisplay.style.display === 'none') {
    hiddenElementDisplay.style.display = 'block';
  } else {
    hiddenElementDisplay.style.display = 'none';
  }
}

async function loadImage({ base64, imageURI }) {
  showToast({
    message: 'Mimeografagem gerada com sucesso!',
  });
  loaderHandler({
    hideElement: '#code-image-wrapper',
  });
  const codeImage = document.createElement('img');
  codeImage.src = imageURI;
  codeImage.setAttribute('id', 'code-image');

  $('#code-image-wrapper').innerHTML = '';
  $('#code-image-wrapper').appendChild(codeImage);
  $('#code-image-base64').src = `data:image/png;base64,${base64}`;
}

function handleError(error) {
  console.log(error, error.errorMessage, error.errorTrace);
  if (error.errorMessage) {
    loaderHandler({
      hideElement: '#code-image-wrapper',
    });
    return showToast({
      message: `Erro a mimeografar! Provavelmente há um erro de sintaxe no seu código.\
      <p>${error.errorMessage}</p><br><br><br>\
      <p>O erro, parece estar perto da linha: ${error.errorTrace.loc.start.line}</p>`,
      timer: 6500,
    });
  }
  loaderHandler({
    hideElement: '#code-image-wrapper',
  });
  return showToast({
    message: error.error,
    timer: 4500,
  });
}

function createImage() {
  const code = $('#codeInput').value;
  const parser = $('#codeParser').value;
  const color = $('#codeBgColor').value;

  loaderHandler({
    hideElement: '#code-image-wrapper',
  });

  fetch(`${apiURL}/v1/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code, parser, color,
    }),
  })
    .then((response) => {
      if (response.ok) {
        // { codeId, code, imageURI, base64 }
        response.json().then(loadImage);
      } else {
        response
          .json()
          .then((err) => handleError(err));
      }
    })
    .catch((error) => {
      showToast({
        message: error.message,
        timer: 4500,
      });
    });
}

async function copyImageToClipboard() {
  const imageUrl = $('#code-image').src;
  // God save the kittens 🐱
  // https://www.youtube.com/watch?v=sP4NMoJcFd4
  if (imageUrl) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': await fetch(imageUrl).then((r) => {
            showToast({
              message: 'Mimeografagem copiada para clipboard',
            });
            return r.blob();
          }),
        }),
      ]);
    } catch (error) {
      showToast({
        message:
          `Deu erro em copyImageToClipboard calma aí, pow: ${error.message}`,
      });
    }
  } else {
    showToast({
      message:
        'Deu erro em copyImageToClipboard calma aí, pow!<br>#code-image.src parece vazio.',
    });
  }
}

function copyBase64Image() {
  const imageBase64URI = $('#code-image-base64').src;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(imageBase64URI)
      .then(() => {
        showToast({
          message: 'Imagem Base64 copiada para o clipboard.',
          timer: 3000,
        });
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
      });
  } else {
    // Fallback for browsers that do not support the Clipboard API
    const tempInput = document.createElement('input');
    tempInput.value = imageBase64URI;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast();
  }
}

function openImageInNewTab() {
  window.open($('#code-image').src, '_blank');
}

function shareImage() {
  const codeImage = $('#code-image');
  const shareUrl = codeImage.src;
  const shareTitle = 'Share Title';

  // Use the Web Share API to trigger the native share dialog
  if (navigator.share) {
    navigator
      .share({
        title: shareTitle,
        url: shareUrl,
      })
      .catch((error) => console.error('Error sharing:', error));
  } else {
    showToast({
      timer: 3000,
      message: 'Web Share API not supported in your browser.',
    });
  }
}

function showTooltip(event) {
  const tooltip = $('.tooltip');
  const tooltipText = event.target.getAttribute('data-tooltip');
  tooltip.textContent = tooltipText;

  // Position the tooltip above the button
  const buttonRect = event.target.getBoundingClientRect();
  tooltip.style.top = `${buttonRect.top - tooltip.offsetHeight - 5}px`;
  tooltip.style.left = `${
    buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2
  }px`;

  tooltip.classList.add('show');
}

function hideTooltip() {
  // Remove the 'show' class to hide the tooltip
  $('.tooltip').classList.remove('show');
}

// JavaScript to handle the dialog
function openDialog(dialogId) {
  $(`#dialog-container${dialogId.replace('#', '-')}`).classList.add('active');
  $(dialogId).classList.add('active');
}

function closeDialog(dialogId) {
  $(`#dialog-container${dialogId.replace('#', '-')}`).classList.remove(
    'active',
  );
  $(dialogId).classList.remove('active');
}

// function updateLineNumbers() {
//   const codeInput = $('#codeInput');
//   const lineNumbersContainer = $('#lineNumbers');
//
//   // Get the number of lines in the textarea
//   const lineCount = codeInput.value.split('\n').length;
//
//   // Generate the line numbers and update the container
//   let lineNumbersHTML = '';
//   for (let i = 1; i <= lineCount; i++) {
//     lineNumbersHTML += `<span>${i}</span>\n`;
//   }
//   lineNumbersContainer.innerHTML = lineNumbersHTML;
// }

function initial() {
  const buttons = document.querySelectorAll('.tooltip-btn');

  buttons.forEach((button) => {
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);
  });

  const textarea = $('#codeInput');
  const lineNumbers = $('.line-numbers');

  textarea.addEventListener('keyup', (event) => {
    const numberOfLines = event.target.value.split('\n').length;

    lineNumbers.innerHTML = Array(numberOfLines).fill('<span></span>').join('');
  });

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      textarea.value = `${textarea.value.substring(0, start)
      }\t${
        textarea.value.substring(end)}`;

      event.preventDefault();
    }
  });
}

let app = {};

// eslint-disable-next-line
app = {
  initial,
  closeDialog,
  openDialog,
  createImage,
  copyImageToClipboard,
  copyBase64Image,
  openImageInNewTab,
  showTooltip,
  showToast,
  shareImage,
};
