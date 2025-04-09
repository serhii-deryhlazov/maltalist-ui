import { HttpService } from './services/httpService.js';

class ListingsService {
  static async getAllListings() {
    const url = `${API_URL}/listings`;
    return await HttpService.get(url);
  }

  static async getListingById(id) {
    const url = `${API_URL}/listings/${id}`;
    return await HttpService.get(url);
  }
}

export { ListingsService };
