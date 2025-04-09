import { HttpService } from './services/httpService.js';

class UserProfileService {
  static async getUserProfile() {
    const url = `${API_URL}/profile`;
    return await HttpService.get(url);
  }
}

export { UserProfileService };
