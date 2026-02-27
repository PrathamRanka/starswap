import axios from 'axios';

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json'
  }
});

export default githubClient;