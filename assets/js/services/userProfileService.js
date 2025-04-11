import { HttpService } from './httpService.js';

class UserProfileService {
  static async getUserProfile(id) {
      return await HttpService.get(`/api/UserProfile/${id}`);
  }

  static async createUserProfile(data) {
      return await HttpService.post('/api/UserProfile', data);
  }

  static async updateUserProfile(id, data) {
      return await HttpService.put(`/api/UserProfile/${id}`, data)
      .then(res => res.ok ? res.json() : null)
        .catch(err => {
            console.error('PUT request failed:', err);
            return null;
      });
  }

  static async deleteUserProfile(id) {
      return await fetch(`/api/UserProfile/${id}`, {
          method: 'DELETE'
      }).then(res => res.ok)
        .catch(err => {
            console.error('DELETE request failed:', err);
            return false;
        });
  }

  static async verifyGoogleLogin(idToken) {
      return await HttpService.post('/api/GoogleAuth/login', { idToken });
  }
}

export { UserProfileService };