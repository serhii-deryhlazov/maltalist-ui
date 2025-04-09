import { HttpService } from './services/httpService.js';

class CreateListingService {
  static async createListing(data) {
    const url = `${API_URL}/create`;
    return await HttpService.post(url, data);
  }
}

export { CreateListingService };
