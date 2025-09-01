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

        let options = {
          method: 'POST',
        };

        if (data instanceof FormData) {
          options.body = data;
        } else {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('POST request failed:', error);
        return { error: Config.ERROR_MESSAGES.NETWORK_ERROR };
      }
    }

    static async put(endpoint, data) {
      try {
        const url = `${Config.API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'PUT',
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
        console.error('PUT request failed:', error);
        return { error: Config.ERROR_MESSAGES.NETWORK_ERROR };
      }
    }

    static async delete(endpoint) {
      try {
        const url = `${Config.API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`DELETE request failed with status ${response.status}`);
        }
        return true;
      } catch (error) {
        console.error('DELETE request failed:', error);
        return false;
      }
    }
    
  }
  
  export { HttpService };