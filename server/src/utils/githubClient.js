import logger from './logger.js';

const githubClient = {
  async get(endpoint) {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Starswap-Backend'
    };

    // If a Personal Access Token is provided, we can bypass the strict 60 req/hr public limit.
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    } else {
      logger.warn('No GITHUB_TOKEN provided. GitHub API is limited to 60 requests/hour!');
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const error = new Error(`GitHub API Error: ${response.statusText}`);
      // Mimic axios error structure for downstream compatibility
      error.response = { status: response.status };
      throw error;
    }

    const data = await response.json();
    
    
    return { data };
  }
};

export default githubClient;