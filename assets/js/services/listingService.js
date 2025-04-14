import { HttpService } from './httpService.js';

class ListingService {
  static async getAllListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await HttpService.get(`/api/Listings?${query}`);
  }

  static async getListingById(id) {
    return await HttpService.get(`/api/Listings/${id}`);
  }

  static async createListing(data) {
    return await HttpService.post('/api/Listings', data);
  }

  static async updateListing(id, data) {
    return await fetch(`/api/Listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.ok ? res.json() : null)
      .catch(err => {
        console.error('PUT request failed:', err);
        return null;
      });
  }

  static async deleteListing(id) {
    return await fetch(`/api/Listings/${id}`, {
      method: 'DELETE'
    }).then(res => res.ok)
      .catch(err => {
        console.error('DELETE request failed:', err);
        return false;
      });
  }

  static async getCategories() {
    return await HttpService.get('/api/Listings/categories');
  }

  static async getUserListings(userId) {
    return await HttpService.get(`/api/Listings/${userId}/listings`);
  }
}

export { ListingService };
