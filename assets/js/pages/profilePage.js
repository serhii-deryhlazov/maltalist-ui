import { UserProfileService } from '../services/userProfileService.js';
import { CacheService } from '../services/cacheService.js';
import { ListingService } from '../services/listingService.js';

export class ProfilePage {

    init(loadContent) {
        const currentUser = CacheService.GetCurrentUser();
        $('#profile').click((e) => {
            e.preventDefault();

            if (!currentUser || !currentUser.id) {
                $('#content').html(`<div id="nouser"><h1>No User Logged In</h1>
                    <script src="https://accounts.google.com/gsi/client" async defer></script>
                    <div id="g_id_onload"
                        data-client_id="763140433455-9tudkmcpnbec0dv4ndej56r1kho6hd3o.apps.googleusercontent.com"
                        data-callback="onGoogleSignIn"
                        data-auto_prompt="false">
                    </div>
                
                    <div class="g_id_signin"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="sign_in_with"
                        data-size="large"
                        data-logo_alignment="left">
                    </div></div>`);
            } else {
                history.pushState({}, '', `/profile/${currentUser.id}`);
                if (loadContent) {
                    loadContent('My Profile');
                    this.show(loadContent);
                }
            }
        });

        window.onGoogleSignIn = async function (response) {
            try {
                const credential = response.credential;
                const user = await UserProfileService.verifyGoogleLogin(credential);
                if (user && user.id) {
                    CacheService.set("current_user", user);
                    window.location.href = '/profile/' + user.id;
                } else {
                    alert("Login failed on server.");
                }
            } catch (err) {
                console.error("Google login error:", err);
                alert("Google login failed.");
            }
        };
    }

    async show(loadContent, showCreate) {
        const userId = window.location.pathname.split('/')[2];
        const currentUser = CacheService.GetCurrentUser();
        const profile = await UserProfileService.getUserProfile(userId);

        if (profile) {
            let profileDetailsHTML = '<div id="profile-info">';
            profileDetailsHTML += `
                <div id="profile-header">
                <img src="${profile.userPicture || 'https://via.placeholder.com/100'}" alt="Profile Picture">
                <div id="profile-header-data">
                <h2>${profile.userName || 'No Name Provided'}</h2>
            `;

            if (profile.phoneNumber) {
                profileDetailsHTML += `<p><strong>Phone Number:</strong> ${profile.phoneNumber}</p>`;
            }

            if (currentUser && currentUser.id === profile.id) {
                profileDetailsHTML += `
                    </div></div>
                    <button id="create">
                        <span class="material-symbols-outlined">add</span> Create Listing
                    </button>
                    <button id="edit-profile-btn">
                        <span class="material-symbols-outlined">edit</span> Edit Profile
                    </button>
                    <button id="logout-btn">
                        <span class="material-symbols-outlined">logout</span> Log Out
                    </button>
                `;
            }

            profileDetailsHTML += '</div>';
            profileDetailsHTML += '<div id="profile-listings">';
            
            const myListings = await ListingService.getUserListings(userId);
            if (myListings && myListings.length > 0) {
                profileDetailsHTML += `<h3>Listings</h3><ul id="my-listings">`;
                for (const listing of myListings) {
                    const pictures = await ListingService.getListingPictures(listing.id);
                    profileDetailsHTML += `
                        <a class="profile-listing-link" href="/listing/${listing.id}">
                        <li class="profile-listing">
                            <img src="${pictures[0]}" alt="${listing.title}">
                            <div class="listing-info">
                            <strong>${listing.title}</strong>
                            <span>${listing.category || ''} | ${listing.price.toFixed(2)}€</span>
                            </div>
                        </li>
                        </a>
                    `;
                }
                profileDetailsHTML += `</ul>`;
            } else {
                profileDetailsHTML += `<h3>Listings</h3><p>No listings found.</p>`;
            }
            profileDetailsHTML += '</div>';

            document.getElementById('profile-details').innerHTML = profileDetailsHTML;

            const createBtn = document.getElementById('create');
            if (createBtn) {
                createBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadContent('Create Listing', () => showCreate());
                    history.pushState({}, '', '/create');
                });
            }
            
            const editProfileBtn = document.getElementById('edit-profile-btn');
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => {
                    document.getElementById('profile-details').innerHTML = `
                        <h2>Edit Profile</h2>
                        <form id="edit-profile-form">
                            <label for="name">New Name:</label>
                            <input type="text" id="name" name="name" value="${profile.userName || ''}" required>
                            <label for="phoneNumber">Phone Number:</label>
                            <input type="tel" id="phoneNumber" name="phoneNumber" value="${profile.phoneNumber || ''}">
                            <button type="submit">Save</button>
                        </form>
                    `;
            
                    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const newName = document.getElementById('name').value;
                        const newPhoneNumber = document.getElementById('phoneNumber').value;
                        const currentUser = CacheService.GetCurrentUser();
                        currentUser.userName = newName;
                        currentUser.phoneNumber = newPhoneNumber;
                        CacheService.set("current_user", currentUser);
                        await UserProfileService.updateUserProfile(profile.id, currentUser);
            
                        window.location.reload();
                    });
                });
            }

            const logOutBtn = document.getElementById('logout-btn');
            if (logOutBtn) {
                logOutBtn.addEventListener('click', () => {
                    CacheService.remove("current_user");
                    window.location.href = '/';
                });
            }
        } else {
            document.getElementById('profile-details').innerHTML = '<p>Profile not found.</p>';
        }
    }

    static async processImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("No file provided."));
                return;
            }

            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set maximum dimensions for the processed image
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions while maintaining aspect ratio
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    // Set canvas dimensions
                    canvas.width = width;
                    canvas.height = height;

                    // Draw the image to the canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert the canvas content to a JPEG data URL with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    // Resolve the promise with the Base64 string
                    resolve(dataUrl);
                };
                img.onerror = (err) => {
                    reject(new Error("Failed to load image from file."));
                };
                img.src = readerEvent.target.result;
            };
            reader.onerror = (err) => {
                reject(new Error("Failed to read file."));
            };
            reader.readAsDataURL(file);
        });
    }
}