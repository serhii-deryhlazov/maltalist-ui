import { HttpService } from './httpService.js';

class ListingService {
  static async getAllListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await HttpService.get(`/Listings/minimal?${query}`);
  }

  static async addListingPictures(listingId, pictures) {
    const formData = new FormData();
    pictures.forEach((file, idx) => {
      formData.append(`Picture${idx + 1}`, file);
    });
    return await HttpService.post(`/pictures/${listingId}`, formData);
  }

  static async getListingById(id) {
    return await HttpService.get(`/Listings/${id}`);
  }

  static async createListing(data) {
    return await HttpService.post('/Listings', data);
  }

  static async updateListing(id, data) {
    return await HttpService.put(`/Listings/${id}`, data);
}

  static async deleteListing(id) {
    return await HttpService.delete(`/Listings/${id}`);
  }

  static async getCategories() {
    return await HttpService.get('/Listings/categories');
  }

  static async getUserListings(userId) {
    return await HttpService.get(`/Listings/${userId}/listings`);
  }

  static async getListingPictures(id) {
    return await HttpService.get(`/pictures/${id}`);
  }

  static async getPromotedListings(category) {
    return await HttpService.get(`/Promotions/promoted/${category}`);
  }
}

export { ListingService };
