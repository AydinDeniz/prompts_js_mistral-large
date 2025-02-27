function compressImage(file, compressionLevel = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        canvas.toBlob(blob => {
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          }));
        }, file.type, compressionLevel);
      }
      img.src = event.target.result;
    }
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Example usage
document.getElementById('fileInput').addEventListener('change', async function(event) {
  const file = event.target.files[0];
  const compressedFile = await compressImage(file, 0.5);
  console.log(compressedFile);
});