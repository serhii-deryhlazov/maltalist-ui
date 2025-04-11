import { UserProfileService } from '/assets/js/services/userProfileService.js';

window.onload = async () => {
    const userId = window.location.pathname.split('/')[2];
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    const profile = await UserProfileService.getUserProfile(userId);

    if (profile) {
        let profileDetailsHTML = `
            <p>User: ${profile.userName}</p>
            <h3>Your Listings</h3>
            <div>${profile.listings.map(listing => `<p>${listing.name} - ${listing.description}</p>`).join('')}</div>
        `;

        if (currentUser && currentUser.id === profile.id) {
            profileDetailsHTML += `
                <button id="edit-profile-btn">Edit Profile</button>
            `;
        }

        document.getElementById('profile-details').innerHTML = profileDetailsHTML;

        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                document.getElementById('profile-details').innerHTML = `
                    <h2>Edit Profile</h2>
                    <form id="edit-profile-form">
                        <label for="name">New Name:</label>
                        <input type="text" id="name" name="name" value="${profile.userName}" required>
                        <button type="submit">Save</button>
                    </form>
                `;

                document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const newName = document.getElementById('name').value;
                    const updatedProfile = await UserProfileService.updateUserName(profile.id, newName);

                    if (updatedProfile) {
                        alert('Profile updated successfully!');
                        window.location.reload();
                    } else {
                        alert('Error updating profile.');
                    }
                });
            });
        }
    } else {
        document.getElementById('profile-details').innerHTML = '<p>Profile not found.</p>';
    }
};