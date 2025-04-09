import { HttpService } from './services/httpService.js';

class HomeService {
  static async getHomeData() {
    const url = `${API_URL}/home/home-data`;
    return await HttpService.get(url);
  }
}

export { HomeService };
