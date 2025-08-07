// script.js
// Wait for DOM loaded
(function() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const resultSection = document.getElementById('resultSection');
  const originalImg = document.getElementById('originalImg');
  const upscaledImg = document.getElementById('upscaledImg');
  const downloadBtn = document.getElementById('downloadBtn');
  const loadingDiv = document.getElementById('loading');
    // Hide loading and result sections initially
  loadingDiv.hidden = true;
  loadingDiv.style.display = 'none';
  resultSection.style.display = 'none';


  // Initialize upscaler instance
  // We'll load a medium-sized model to balance quality and speed
  const upscaler = new Upscaler({
    // use default model; if default fails, you can specify a path or a built-in name
    // such as 'esrgan-slim', but default should work across browsers
    // patch size helps performance for large images
    
        model: ESRGANSlim2x,
patchSize: 128,
    padding: 2,
  });

  // Show loading UI
  function showLoading(show) {
  if (show) {
    loadingDiv.hidden = false;
    loadingDiv.style.display = 'flex';
  } else {
    loadingDiv.hidden = true;
    loadingDiv.style.display = 'none';
  }
  // Handle file input change
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await processImageFile(file);
  });

  // Handle drag-and-drop
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
    if (!file) return;
    await processImageFile(file);
  });

  // Convert HEIC to blob using heic2any
  async function convertHeicToBlob(file) {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
    // heic2any returns Blob or array of Blob, handle accordingly
    if (Array.isArray(blob)) {
      return blob[0];
    }
    return blob;
  }

  async function processImageFile(file) {
    try {
      resultSection.style.display = 'none';
      showLoading(true);
      let inputFile = file;
      // Convert HEIC/HEIF files to JPEG using heic2any
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        inputFile = await convertHeicToBlob(file);
      }
      // Read file into an image element
      const imageURL = URL.createObjectURL(inputFile);
      originalImg.src = imageURL;
      // Wait for original image to load
      await originalImg.decode();
      // Upscale using UpscalerJS
      const upscaledDataUrl = await upscaler.upscale(originalImg);
      upscaledImg.src = upscaledDataUrl;
      // Set download link
      downloadBtn.href = upscaledDataUrl;
      downloadBtn.download = 'upscaled_' + file.name.replace(/\.[^.]+$/, '.png');
      // Reveal result section
      resultSection.style.display = 'flex';
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Oops! Something went wrong while processing your image. Please try a smaller file or use a different image.');
    } finally {
      showLoading(false);
    }
  }
})();
