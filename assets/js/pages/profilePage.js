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

    async show(loadContent){
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
                myListings.forEach(listing => {
                    const picture = listing.picture1 || 'https://via.placeholder.com/80';
                    profileDetailsHTML += `
                    <a class="profile-listing-link" href="/listing/${listing.id}">
                        <li class="profile-listing">
                            <img src="${picture}" alt="${listing.title}">
                            <div class="listing-info">
                                <strong>${listing.title}</strong>
                                <span>${listing.category || ''} | ${listing.price.toFixed(2)}€</span>
                            </div>
                        </li>
                    </a>
                    `;
                });
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
                    loadContent('Create Listing', () => {
                        const form = document.getElementById('create-listing-form');
                        const pictureInputsDiv = document.getElementById('picture-inputs');
                        const pictureFiles = Array(10).fill(null);

                        // Generate 10 file inputs and preview containers
                        pictureInputsDiv.innerHTML = '';
                        for (let i = 0; i < 10; i++) {
                            const wrapper = document.createElement('div');
                            wrapper.style.position = 'relative';
                            wrapper.style.width = '300px';
                            wrapper.style.height = '300px';
                            wrapper.style.display = 'flex';
                            wrapper.style.alignItems = 'center';
                            wrapper.style.justifyContent = 'center';

                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.style.display = 'none';
                            input.dataset.idx = i;

                            const preview = document.createElement('div');
                            preview.style.width = '300px';
                            preview.style.height = '300px';
                            preview.style.display = 'flex';
                            preview.style.alignItems = 'center';
                            preview.style.justifyContent = 'center';
                            preview.style.background = '#f9fafb';
                            preview.style.border = '2px dashed #bfc9d9';
                            preview.style.borderRadius = '8px';
                            preview.style.cursor = 'pointer';
                            preview.style.position = 'relative';
                            preview.style.overflow = 'hidden';
                            preview.style.transition = 'border 0.2s';

                            const plus = document.createElement('span');
                            plus.textContent = '+';
                            plus.style.fontSize = '2.5rem';
                            plus.style.color = '#bfc9d9';
                            plus.style.position = 'absolute';
                            plus.style.left = '50%';
                            plus.style.top = '50%';
                            plus.style.transform = 'translate(-50%, -50%)';
                            plus.style.pointerEvents = 'none';

                            const img = document.createElement('img');
                            img.style.display = 'none';
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'cover';
                            img.style.borderRadius = '8px';
                            img.style.position = 'absolute';
                            img.style.top = '0';
                            img.style.left = '0';

                            const delBtn = document.createElement('button');
                            delBtn.type = 'button';
                            delBtn.textContent = '✕';
                            delBtn.style.position = 'absolute';
                            delBtn.style.top = '2px';
                            delBtn.style.right = '2px';
                            delBtn.style.background = 'rgba(0,0,0,0.6)';
                            delBtn.style.color = 'white';
                            delBtn.style.border = 'none';
                            delBtn.style.borderRadius = '50%';
                            delBtn.style.width = '22px';
                            delBtn.style.height = '22px';
                            delBtn.style.cursor = 'pointer';
                            delBtn.style.display = 'none';
                            delBtn.style.zIndex = '2';

                            preview.addEventListener('click', () => input.click());

                            // Handle file input change
                            input.addEventListener('change', function() {
                                const idx = parseInt(this.dataset.idx);
                                if (this.files && this.files[0]) {
                                    const file = this.files[0];
                                    if (!file.type.startsWith('image/')) {
                                        alert('Only image files are allowed.');
                                        this.value = '';
                                        img.style.display = 'none';
                                        plus.style.display = 'block';
                                        delBtn.style.display = 'none';
                                        pictureFiles[idx] = null;
                                        preview.style.border = '2px dashed #bfc9d9';
                                        return;
                                    }
                                    img.src = URL.createObjectURL(file);
                                    img.style.display = 'block';
                                    plus.style.display = 'none';
                                    delBtn.style.display = 'block';
                                    pictureFiles[idx] = file;
                                    preview.style.border = '2px solid #4f8cff';
                                } else {
                                    img.style.display = 'none';
                                    plus.style.display = 'block';
                                    delBtn.style.display = 'none';
                                    pictureFiles[idx] = null;
                                    preview.style.border = '2px dashed #bfc9d9';
                                }
                            });

                            // Handle delete button
                            delBtn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                input.value = '';
                                img.style.display = 'none';
                                plus.style.display = 'block';
                                delBtn.style.display = 'none';
                                pictureFiles[i] = null;
                                preview.style.border = '2px dashed #bfc9d9';
                            });

                            preview.appendChild(img);
                            preview.appendChild(plus);
                            wrapper.appendChild(input);
                            wrapper.appendChild(preview);
                            wrapper.appendChild(delBtn);
                            pictureInputsDiv.appendChild(wrapper);
                        }

                        form.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const formMessage = document.getElementById('form-message');
                            formMessage.textContent = '';

                            const pictureData = {};
                            try {
                                let count = 0;
                                for (let i = 0; i < 10; i++) {
                                    const file = pictureFiles[i];
                                    if (file) {
                                        const processedImage = ProfilePage.processImage(file);
                                        pictureData[`Picture${i + 1}`] = processedImage;
                                        count++;
                                    }
                                }
                            } catch (error) {
                                console.error('Image processing error:', error);
                                formMessage.textContent = 'Error processing images.';
                                formMessage.style.color = 'red';
                                return;
                            }

                            const data = {
                                Title: document.getElementById('name').value,
                                Description: document.getElementById('description').value,
                                Price: parseFloat(document.getElementById('price').value),
                                Category: document.getElementById('category').value || null,
                                Location: document.getElementById('location').value || null,
                                UserId: CacheService.get('current_user')?.id
                            };

                            try {
                                const response = await ListingService.createListing(data);
                                if (response && response.id) {
                                    
                                    const pictures = pictureFiles.filter(f => f); // Only non-null files
                                    if (pictures.length > 0) {
                                        try {
                                            await ListingService.addListingPictures(response.id, pictures);
                                        } catch (imgErr) {
                                            console.error('Error uploading images:', imgErr);
                                            formMessage.textContent = 'Listing created, but image upload failed.';
                                            formMessage.style.color = 'orange';
                                            window.location.href = `/listing/${response.id}`;
                                            return;
                                        }
                                    }

                                    formMessage.textContent = 'Listing created successfully!';
                                    formMessage.style.color = 'green';
                                    form.reset();
                                    // Clear previews and files
                                    Array.from(pictureInputsDiv.querySelectorAll('img')).forEach(img => img.style.display = 'none');
                                    Array.from(pictureInputsDiv.querySelectorAll('button')).forEach(btn => btn.style.display = 'none');
                                    pictureFiles.fill(null);
                                    if (response.id) {
                                        window.location.href = `/listing/${response.id}`;
                                    }
                                } else {
                                    formMessage.textContent = 'Failed to create listing. Please try again.';
                                    formMessage.style.color = 'red';
                                }
                            } catch (error) {
                                console.error('Create listing error:', error);
                                formMessage.textContent = 'Error creating listing.';
                                formMessage.style.color = 'red';
                            }
                        });
                    });
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