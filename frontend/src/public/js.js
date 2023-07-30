const $ = (element) => document.querySelector(element);
const apiURL = "https://mimeografo-api.onrender.com";

function loaderHandler({ hideElement }) {
  const loaderDisplay = $("#spinner-loader");
  const hiddenElementDisplay = $(hideElement);

  if (loaderDisplay.style.display === "none") {
    loaderDisplay.style.display = "block";
  } else {
    loaderDisplay.style.display = "none";
  }

  if (hiddenElementDisplay.style.display === "none") {
    hiddenElementDisplay.style.display = "block";
  } else {
    hiddenElementDisplay.style.display = "none";
  }
}

const createImage = () => {
  const code = $("#codeInput").value;
  const title = $("#codeTitle").value;
  const parser = $("#codeParser").value;

  loaderHandler({
    hideElement: "#code-image",
  });

  fetch(`${apiURL}/v1/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, title, parser }),
  })
    .then(async (response) => {
      if (response.ok) {
        // { codeId, code, title, imageURI, base64 }
        response.json().then(loadImage);
      } else {
        const r = await response.json();
        showToast({
          message: r.error,
          timer: 4500,
        });
        loaderHandler({
          hideElement: "#code-image",
        });
      }
    })
    .catch((error) => {
      showToast({
        message: error.message,
        timer: 4500,
      });
    });
};

async function loadImage({ base64, imageURI }) {
  showToast({
    message: "Mimeografagem gerada com sucesso!",
  });
  loaderHandler({
    hideElement: "#code-image",
  });

  $("#code-image").src = imageURI;
  $("#code-image-base64").src = `data:image/png;base64,${base64}`;
}

const copyImageToClipboard = async () => {
  const imageUrl = $("#code-image").src;
  const mimeType = imageUrl.startsWith("http://placekitten.com")
    ? "image/jpg"
    : "image/png";
  if (imageUrl) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [mimeType]: await fetch(imageUrl).then((r) => r.blob()),
        }),
      ]);
    } catch (error) {
      showToast({
        message:
          "Deu eurro em copyImageToClipboard calma aí, pow: " + error.message,
      });
    }
  } else {
    showToast({
      message: "Deu erro em copyImageToClipboard calma aí, pow!",
    });
  }
};

function showToast(options) {
  let timer = 3000;
  let message = "";
  if (options) {
    timer = options.timer ?? timer;
    message = options.message ?? message;
  }

  const toast = $("#toastMessage");
  toast.innerHTML = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.innerHTML = "";
  }, timer);
}

function copyBase64Image() {
  const imageaBase64URI = $("#code-image-base64").src;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(imageaBase64URI)
      .then(() => {
        showToast({
          message: "Imagem Base64 copiada para o clipboard.",
        });
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error);
      });
  } else {
    // Fallback for browsers that do not support the Clipboard API
    const tempInput = document.createElement("input");
    tempInput.value = imageaBase64URI;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    showToast();
  }
}

function openImageInNewTab() {
  window.open($("#code-image").src, "_blank");
}

function shareImage() {
  const codeImage = $("#code-image");
  const shareUrl = codeImage.src;
  const shareTitle = "Share Title";

  // Use the Web Share API to trigger the native share dialog
  if (navigator.share) {
    navigator
      .share({
        title: shareTitle,
        url: shareUrl,
      })
      .catch((error) => console.error("Error sharing:", error));
  } else {
    showToast({
      timer: 3000,
      message: "Web Share API not supported in your browser.",
    });
  }
}

function showTooltip(event) {
  // Get the tooltip element
  const tooltip = document.querySelector(".tooltip");

  // Set the tooltip text based on the data-tooltip attribute
  const tooltipText = event.target.getAttribute("data-tooltip");
  tooltip.textContent = tooltipText;

  // Position the tooltip above the button
  const buttonRect = event.target.getBoundingClientRect();
  tooltip.style.top = `${buttonRect.top - tooltip.offsetHeight - 5}px`;
  tooltip.style.left = `${
    buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2
  }px`;

  // Add the 'show' class to make the tooltip visible
  tooltip.classList.add("show");
}

function hideTooltip() {
  // Get the tooltip element
  const tooltip = document.querySelector(".tooltip");

  // Remove the 'show' class to hide the tooltip
  tooltip.classList.remove("show");
}

function initial() {
  const buttons = document.querySelectorAll(".tooltip-btn");

  buttons.forEach((button) => {
    button.addEventListener("mouseenter", showTooltip);
    button.addEventListener("mouseleave", hideTooltip);
  });
  $("#code-image").src = "http://placekitten.com/200/300";
}
