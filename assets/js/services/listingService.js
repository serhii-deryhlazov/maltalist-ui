import { HttpService } from './httpService.js';

class ListingService {
  static async getAllListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await HttpService.get(`/api/Listings/minimal?${query}`);
  }

  static async addListingPictures(listingId, pictures) {
    const formData = new FormData();
    pictures.forEach((file, idx) => {
      formData.append(`Picture${idx + 1}`, file);
    });
    return await HttpService.post(`/api/pictures/${listingId}`, formData);
  }

  static async updateListingPictures(listingId, pictures) {
    const formData = new FormData();
    pictures.forEach((file, idx) => {
      formData.append(`Picture${idx + 1}`, file);
    });
    return await HttpService.put(`/api/pictures/${listingId}`, formData);
  }

  static async getListingById(id) {
    return await HttpService.get(`/api/Listings/${id}`);
  }

  static async createListing(data) {
    return await HttpService.post('/api/Listings', data);
  }

  static async updateListing(id, data) {
    return await HttpService.put(`/api/Listings/${id}`, data);
}

  static async deleteListing(id) {
    return await HttpService.delete(`/api/Listings/${id}`);
  }

  static async getCategories() {
    return await HttpService.get('/api/Listings/categories');
  }

  static async getUserListings(userId) {
    return await HttpService.get(`/api/Listings/${userId}/listings`);
  }

  static async getListingPictures(id) {
    return await HttpService.get(`/api/pictures/${id}`);
  }
}

export { ListingService };
