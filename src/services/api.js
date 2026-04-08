import axios from 'axios';
import { saveShows, setLastSync } from '../lib/db';

const BASE_URL = 'https://api.tvmaze.com';

export const fetchShowsPage = async (page) => {
  const response = await axios.get(`${BASE_URL}/shows?page=${page}`);
  return response.data;
};

export const syncShows = async (onProgress) => {
  let totalCount = 0;
  // We'll fetch up to 40 pages (10,000 shows)
  for (let i = 0; i < 40; i++) {
    try {
      const shows = await fetchShowsPage(i);
      if (shows.length === 0) break;
      await saveShows(shows);
      totalCount += shows.length;
      if (onProgress) onProgress(totalCount);
    } catch (error) {
      console.error(`Error fetching page ${i}:`, error);
      break;
    }
  }
  await setLastSync(Date.now());
};

export const searchShows = async (query) => {
  const response = await axios.get(`${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
  return response.data.map((item) => item.show);
};
