// script.js for Snapchat Dog Filter
// This script handles image uploading, face detection using face‑api.js and
// overlays a cartoonish dog filter (ears and nose) onto the detected face.

(function() {
  // Grab UI elements
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const resultSection = document.getElementById('resultSection');
  const resultCanvas = document.getElementById('resultCanvas');
  const downloadBtn = document.getElementById('downloadBtn');
  const loadingDiv = document.getElementById('loading');

  // Hide result section initially
  resultSection.style.display = 'none';
  showLoading(false);

  // Helper to toggle loading spinner
  function showLoading(show) {
    if (!loadingDiv) return;
    if (show) {
      loadingDiv.hidden = false;
      loadingDiv.style.display = 'flex';
    } else {
      loadingDiv.hidden = true;
      loadingDiv.style.display = 'none';
    }
  }

  // Flag to ensure models are loaded only once
  let modelsLoaded = false;

  // Load face detection and landmark models from CDN
  async function ensureModels() {
    if (modelsLoaded) return;
    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  }

  // Convert HEIC/HEIF images to JPEG using heic2any
  async function convertHeicToBlob(file) {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
    if (Array.isArray(blob)) return blob[0];
    return blob;
  }

  // Process uploaded image: detect face and draw dog filter
  async function processImageFile(file) {
    try {
      resultSection.style.display = 'none';
      showLoading(true);

      // Convert HEIC/HEIF images to JPEG
      let inputFile = file;
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        inputFile = await convertHeicToBlob(file);
      }

      // Read image into HTMLImageElement
      const imageURL = URL.createObjectURL(inputFile);
      const img = new Image();
      img.src = imageURL;
      await img.decode();

      // Ensure models are loaded
      await ensureModels();

      // Detect face with landmarks
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512 }))
        .withFaceLandmarks(true);

      // Prepare canvas
      const canvas = resultCanvas;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      // Draw the original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // If a face is detected, overlay the filter
      if (detection) {
        const box = detection.detection.box;
        drawDogFilter(ctx, box);
      } else {
        // If no face detected, log a warning
        console.warn('No face detected in the uploaded image.');
      }

      // Prepare download link
      const dataUrl = canvas.toDataURL('image/png');
      downloadBtn.href = dataUrl;
      downloadBtn.download = 'dog-filter-' + (file.name ? file.name.replace(/\.[^.]+$/, '.png') : 'image.png');

      // Reveal result
      resultSection.style.display = 'flex';
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Oops! Something went wrong while processing your image. Please try a different image.');
    } finally {
      showLoading(false);
    }
  }

  // Draw dog ears and nose relative to detected face bounding box
  function drawDogFilter(ctx, box) {
    // Nose dimensions and position
    const noseWidth = box.width * 0.35;
    const noseHeight = box.height * 0.25;
    const noseCenterX = box.x + box.width / 2;
    const noseCenterY = box.y + box.height * 0.55;

    // Draw nose base (dark brown)
    ctx.fillStyle = '#4d3624';
    ctx.beginPath();
    ctx.ellipse(noseCenterX, noseCenterY, noseWidth / 2, noseHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw nostrils (darker) as two small circles
    ctx.fillStyle = '#2c1a10';
    const nostrilRadius = noseWidth * 0.07;
    ctx.beginPath();
    ctx.arc(noseCenterX - noseWidth * 0.15, noseCenterY + noseHeight * 0.05, nostrilRadius, 0, Math.PI * 2);
    ctx.arc(noseCenterX + noseWidth * 0.15, noseCenterY + noseHeight * 0.05, nostrilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ear dimensions
    const earWidth = box.width * 0.6;
    const earHeight = box.height * 0.6;
    const leftEarX = box.x + box.width * 0.2;
    const rightEarX = box.x + box.width * 0.8;
    const earTopY = box.y - box.height * 0.25;
    const earBottomY = box.y + box.height * 0.1;

    // Draw left ear (outer)
    ctx.fillStyle = '#a2775d';
    ctx.beginPath();
    ctx.moveTo(leftEarX, earTopY);
    ctx.lineTo(leftEarX - earWidth / 2, earBottomY);
    ctx.lineTo(leftEarX + earWidth / 2, earBottomY);
    ctx.closePath();
    ctx.fill();

    // Draw right ear (outer)
    ctx.beginPath();
    ctx.moveTo(rightEarX, earTopY);
    ctx.lineTo(rightEarX - earWidth / 2, earBottomY);
    ctx.lineTo(rightEarX + earWidth / 2, earBottomY);
    ctx.closePath();
    ctx.fill();

    // Inner ear dimensions
    const innerEarWidth = earWidth * 0.5;
    const innerEarHeight = earHeight * 0.5;
    const innerEarTopOffset = earHeight * 0.1;

    // Draw left ear (inner)
    ctx.fillStyle = '#cfaea0';
    ctx.beginPath();
    ctx.moveTo(leftEarX, earTopY + innerEarTopOffset);
    ctx.lineTo(leftEarX - innerEarWidth / 2, earBottomY - (earHeight - innerEarHeight));
    ctx.lineTo(leftEarX + innerEarWidth / 2, earBottomY - (earHeight - innerEarHeight));
    ctx.closePath();
    ctx.fill();

    // Draw right ear (inner)
    ctx.beginPath();
    ctx.moveTo(rightEarX, earTopY + innerEarTopOffset);
    ctx.lineTo(rightEarX - innerEarWidth / 2, earBottomY - (earHeight - innerEarHeight));
    ctx.lineTo(rightEarX + innerEarWidth / 2, earBottomY - (earHeight - innerEarHeight));
    ctx.closePath();
    ctx.fill();
  }

  // Event listeners for file input
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processImageFile(file);
    }
  });

  // Drag‑and‑drop support
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove('dragover');
    });
  });
  uploadArea.addEventListener('drop', async (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
      await processImageFile(file);
    }
  });
})();