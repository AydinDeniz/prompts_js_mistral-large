document.addEventListener('DOMContentLoaded', () => {
  const productId = 'your-product-id'; // Replace with actual product ID
  const apiUrl = `https://api.example.com/products/${productId}`;

  const productContainer = document.getElementById('product-container');
  const reviewsContainer = document.getElementById('reviews-container');
  const ratingFilter = document.getElementById('rating-filter');

  async function fetchProductData() {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      displayProductDetails(data);
      displayReviews(data.reviews);
      cacheData(data);
    } catch (error) {
      console.error('Error fetching product data:', error);
      const cachedData = await getCachedData(productId);
      if (cachedData) {
        displayProductDetails(cachedData);
        displayReviews(cachedData.reviews);
      }
    }
  }

  function displayProductDetails(data) {
    productContainer.innerHTML = `
      <h1>${data.name}</h1>
      <p>${data.description}</p>
      <img src="${data.imageUrl}" alt="${data.name}">
      <p>Price: $${data.price.toFixed(2)}</p>
    `;
  }

  function displayReviews(reviews) {
    reviewsContainer.innerHTML = '';
    reviews.forEach(review => {
      const reviewElement = document.createElement('div');
      reviewElement.classList.add('review');
      reviewElement.innerHTML = `
        <p>Rating: ${review.rating}</p>
        <p>${review.comment}</p>
        <p>By: ${review.user}</p>
      `;
      reviewsContainer.appendChild(reviewElement);
    });
  }

  function filterReviewsByRating(rating) {
    const cachedData = getCachedData(productId);
    if (cachedData) {
      const filteredReviews = cachedData.reviews.filter(review => review.rating >= rating);
      displayReviews(filteredReviews);
    }
  }

  ratingFilter.addEventListener('change', (event) => {
    const rating = parseInt(event.target.value, 10);
    filterReviewsByRating(rating);
  });

  function cacheData(data) {
    const request = indexedDB.open('ecommerceDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('products', { keyPath: 'id' });
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['products'], 'readwrite');
      const objectStore = transaction.objectStore('products');
      objectStore.put(data);
    };
  }

  function getCachedData(id) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ecommerceDB', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['products'], 'readonly');
        const objectStore = transaction.objectStore('products');
        const getRequest = objectStore.get(id);
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  fetchProductData();
});