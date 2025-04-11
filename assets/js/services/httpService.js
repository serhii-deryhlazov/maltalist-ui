import Config from '../config.js';

class HttpService {
    static async get(endpoint) {
      try {
        const url = `${Config.API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('GET request failed:', error);
        return { error: Config.ERROR_MESSAGES.NETWORK_ERROR };
      }
    }
  
    static async post(endpoint, data) {
      try {
        const url = `${Config.API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('POST request failed:', error);
        return { error: Config.ERROR_MESSAGES.NETWORK_ERROR };
      }
    }
  }
  
  export { HttpService };