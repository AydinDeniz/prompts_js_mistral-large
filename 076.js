// JavaScript Function to Lazy-Load Images

// Function to check if an image is near the viewport
function isNearViewport(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 0 && rect.top <= windowHeight;
}

// Function to lazy-load images
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach((image) => {
    if (isNearViewport(image)) {
      image.src = image.getAttribute('data-src');
      image.classList.add('loaded');
      image.removeAttribute('data-src');
    }
  });
}

// Function to handle scroll and resize events
function handleScrollAndResize() {
  lazyLoadImages();
}

// Event listeners for scroll and resize events
window.addEventListener('scroll', handleScrollAndResize);
window.addEventListener('resize', handleScrollAndResize);

// Initial lazy-load check on page load
document.addEventListener('DOMContentLoaded', () => {
  lazyLoadImages();
});

// CSS for smooth transitions between low and high-resolution images
const style = document.createElement('style');
style.innerHTML = `
  img[data-src] {
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }
  img[data-src].loaded {
    opacity: 1;
  }
`;
document.head.appendChild(style);