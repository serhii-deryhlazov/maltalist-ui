import { UserProfileService } from '../services/userProfileService.js';
import { CacheService } from '../services/cacheService.js';
import { ListingService } from '../services/listingService.js';

export class ProfilePage {

    init(loadContent) {
        // Event handling moved to PageLoader for better delegation
        // This method is kept for compatibility but handlers are set in PageLoader
    }

    async show(loadContent, showCreate) {
        const userId = window.location.pathname.split('/')[2];
        const currentUser = CacheService.GetCurrentUser();
        const profile = await UserProfileService.getUserProfile(userId);

        if (profile) {
            let profileDetailsHTML = '<div id="profile-info">';
            profileDetailsHTML += `
                <div id="profile-header">
                <img src="${profile.userPicture || 'https://via.placeholder.com/100'}" 
                     alt="Profile Picture" 
                     onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(profile.userName || 'User')}&size=100&background=004779&color=ffffff&bold=true';">
                <div id="profile-header-data">
                <h2>${profile.userName || 'No Name Provided'}</h2>
                </div></div>
            `;

            if (currentUser && currentUser.id === profile.id) {
                profileDetailsHTML += `
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
                    const imageSrc = pictures && pictures.length > 0 ? pictures[0] : '/assets/img/placeholder.png';
                    profileDetailsHTML += `
                        <a class="profile-listing-link" href="/listing/${listing.id}">
                        <li class="profile-listing">
                            <img src="${imageSrc}" alt="${listing.title}">
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
                        <form id="edit-profile-form">
                            <h2>Edit Profile</h2>
                            <label for="name">Name:</label>
                            <input type="text" id="name" name="name" value="${profile.userName || ''}" required>
                            <label for="phoneNumber">Phone Number:</label>
                            <input type="tel" id="phoneNumber" name="phoneNumber" value="${profile.phoneNumber || ''}" placeholder="+356 7912 3456" pattern="^\\+356\\s?[0-9]{4}\\s?[0-9]{4}$" title="Please enter a valid Maltese phone number (e.g., +356 7912 3456)">
                            <button type="submit">Save Changes</button>
                        </form>
                    `;

                    // Auto-format phone number input
                    const phoneInput = document.getElementById('phoneNumber');
                    
                    // Set initial value with country code if empty
                    if (!phoneInput.value || phoneInput.value.trim() === '') {
                        phoneInput.value = '+356 ';
                    }
                    
                    phoneInput.addEventListener('focus', (e) => {
                        if (!e.target.value || e.target.value.trim() === '') {
                            e.target.value = '+356 ';
                        }
                    });
                    
                    phoneInput.addEventListener('input', (e) => {
                        let value = e.target.value;
                        
                        // Remove all non-digit characters except +
                        let digitsOnly = value.replace(/[^+0-9]/g, '');
                        
                        // Ensure it starts with +356
                        if (!digitsOnly.startsWith('+356')) {
                            digitsOnly = '+356' + digitsOnly.replace(/^\+?356?/, '');
                        }
                        
                        // Limit to +356 + 8 digits max
                        if (digitsOnly.length > 12) {
                            digitsOnly = digitsOnly.substring(0, 12);
                        }
                        
                        // Format with spaces: +356 XXXX XXXX
                        let formatted = '+356';
                        const remainingDigits = digitsOnly.substring(4);
                        
                        if (remainingDigits.length > 0) {
                            formatted += ' ' + remainingDigits.substring(0, 4);
                            if (remainingDigits.length > 4) {
                                formatted += ' ' + remainingDigits.substring(4, 8);
                            }
                        } else {
                            formatted += ' ';
                        }
                        
                        e.target.value = formatted;
                        
                        // Set cursor position after the last digit
                        const cursorPos = formatted.length;
                        setTimeout(() => {
                            e.target.setSelectionRange(cursorPos, cursorPos);
                        }, 0);
                    });
                    
                    phoneInput.addEventListener('keydown', (e) => {
                        // Prevent deletion of country code
                        if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.selectionStart <= 5) {
                            e.preventDefault();
                            e.target.value = '+356 ';
                            e.target.setSelectionRange(5, 5);
                        }
                    });
            
                    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const newName = document.getElementById('name').value;
                        const newPhoneNumber = document.getElementById('phoneNumber').value;
                        
                        // Validate Maltese phone number format if provided
                        if (newPhoneNumber && newPhoneNumber.trim() !== '' && newPhoneNumber !== '+356 ') {
                            const phoneRegex = /^\+356\s[0-9]{4}\s[0-9]{4}$/;
                            if (!phoneRegex.test(newPhoneNumber)) {
                                alert('Please enter a valid Maltese phone number (e.g., +356 7912 3456)');
                                return;
                            }
                        }
                        
                        const currentUser = CacheService.GetCurrentUser();
                        currentUser.userName = newName;
                        currentUser.phoneNumber = newPhoneNumber === '+356 ' ? '' : newPhoneNumber;
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