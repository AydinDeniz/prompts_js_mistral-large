// Personalized News Aggregator

// HTML Structure
document.body.innerHTML = `
  <div id="app">
    <h1>Personalized News Aggregator</h1>
    <div id="topics">
      <label for="topicsSelect">Select Topics of Interest:</label>
      <select id="topicsSelect" multiple>
        <option value="technology">Technology</option>
        <option value="science">Science</option>
        <option value="sports">Sports</option>
        <option value="business">Business</option>
        <option value="entertainment">Entertainment</option>
      </select>
      <button id="savePreferences">Save Preferences</button>
    </div>
    <div id="newsFeed"></div>
    <div id="notifications"></div>
  </div>
`;

// Fetch news articles from an external API
async function fetchNews(topics) {
  const apiKey = 'your_api_key'; // Replace with your actual API key
  const baseUrl = 'https://newsapi.org/v2/top-headlines';

  const requests = topics.map(topic =>
    fetch(`${baseUrl}?category=${topic}&apiKey=${apiKey}`)
      .then(response => response.json())
  );

  const results = await Promise.all(requests);
  return results.flatMap(result => result.articles);
}

// Display news articles in the news feed
function displayNews(articles) {
  const newsFeed = document.getElementById('newsFeed');
  newsFeed.innerHTML = '';

  articles.forEach(article => {
    const articleElement = document.createElement('div');
    articleElement.classList.add('article');
    articleElement.innerHTML = `
      <h2>${article.title}</h2>
      <p>${article.description}</p>
      <a href="${article.url}" target="_blank">Read more</a>
    `;
    newsFeed.appendChild(articleElement);
  });
}

// Save user preferences to local storage
function savePreferences(topics) {
  localStorage.setItem('newsTopics', JSON.stringify(topics));
}

// Load user preferences from local storage
function loadPreferences() {
  const topics = JSON.parse(localStorage.getItem('newsTopics')) || [];
  document.getElementById('topicsSelect').value = topics;
  return topics;
}

// Implement a notification system for breaking news
function notifyBreakingNews(article) {
  const notifications = document.getElementById('notifications');
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.innerHTML = `
    <strong>Breaking News:</strong> ${article.title}
  `;
  notifications.appendChild(notification);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notifications.removeChild(notification);
  }, 5000);
}

// Event listener for saving user preferences
document.getElementById('savePreferences').addEventListener('click', async () => {
  const topicsSelect = document.getElementById('topicsSelect');
  const selectedTopics = Array.from(topicsSelect.selectedOptions).map(option => option.value);
  savePreferences(selectedTopics);

  const articles = await fetchNews(selectedTopics);
  displayNews(articles);

  // Notify breaking news (example: notify the first article as breaking news)
  if (articles.length > 0) {
    notifyBreakingNews(articles[0]);
  }
});

// Load user preferences and fetch news on page load
window.addEventListener('load', async () => {
  const topics = loadPreferences();
  if (topics.length > 0) {
    const articles = await fetchNews(topics);
    displayNews(articles);

    // Notify breaking news (example: notify the first article as breaking news)
    if (articles.length > 0) {
      notifyBreakingNews(articles[0]);
    }
  }
});