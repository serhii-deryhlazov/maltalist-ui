import { UserProfileService } from '/assets/js/services/userProfileService.js';
import { CacheService } from '/assets/js/services/cacheService.js';
import { ListingService } from '/assets/js/services/listingService.js';

$(document).ready(function() {
    
    function loadContent(page) {
        const pageFile = page.toLowerCase().replace(' ', '-') + '.html';
        const pageUrl = `/pages/${pageFile}`;
        
        $('#content').html(`<h1>Loading ${page}...</h1>`);
        
        $('#content').load(pageUrl, async function(response, status, xhr) {
            if (status === 'error') {
                console.error(`Failed to load ${pageUrl}: ${xhr.status} ${xhr.statusText}`);
                $('#content').html(`<h1>Error loading ${page}</h1>`);
                return;
            }
            
            if (page === 'Home') {
                loadHomePageData();
            } else if (page === 'Create Listing') {
                loadCreateListingPage();
            } else if (page === 'My Profile') {
                loadProfilePageData();
            } else if (page === 'Listing Details') {
                loadListingDetailsPage();
            }
        });
    }

    async function loadProfilePageData() {
        const userId = window.location.pathname.split('/')[2];
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        const profile = await UserProfileService.getUserProfile(userId);

        if (profile) {
            let profileDetailsHTML = `
                <p>User: ${profile.userName}</p>
            `;

            if (currentUser && currentUser.id === profile.id) {
                profileDetailsHTML += `
                    <button id="edit-profile-btn">Edit Profile</button>
                    <button id="logout-btn">Log Out</button>
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
                        const currentUser = CacheService.get("current_user");
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

    function loadHomePageData(params = { page: 1, limit: 10 }) {
        const listingsContainer = $('#listing-list');
        const searchInput = $('<input type="text" id="search" placeholder="Search listings...">');
        const searchButton = $('<button>Search</button>');
        const listingsPage = $('#listings-page');
    
        // Add search UI
        listingsPage.prepend(searchButton);
        listingsPage.prepend(searchInput);
    
        function fetchListings() {
            listingsContainer.html('<p>Loading...</p>');
            ListingService.getAllListings(params)
                .then(response => {
                    const { listings, totalNumber, page } = response;
                    let listingsHtml = '<ul>';
                    listings.forEach(listing => {
                        const picture = listing.picture1 || 'https://via.placeholder.com/100';
                        listingsHtml += `
                            <li>
                                <img src="${picture}" alt="${listing.title}" style="max-width: 100px; max-height: 100px;">
                                <div>
                                    <h3><a href="/listing/${listing.id}">${listing.title}</a></h3>
                                    <p>Price: ${listing.price.toFixed(2)} EUR</p>
                                    <p>Category: ${listing.category || 'None'}</p>
                                </div>
                            </li>
                        `;
                    });
                    listingsHtml += '</ul>';
    
                    // Pagination
                    const totalPages = Math.ceil(totalNumber / params.limit);
                    let paginationHtml = '<div class="pagination">';
                    if (page > 1) {
                        paginationHtml += `<button class="page-btn" data-page="${page - 1}">Previous</button>`;
                    }
                    paginationHtml += `<span>Page ${page} of ${totalPages}</span>`;
                    if (page < totalPages) {
                        paginationHtml += `<button class="page-btn" data-page="${page + 1}">Next</button>`;
                    }
                    paginationHtml += '</div>';
    
                    listingsContainer.html(listingsHtml + paginationHtml);
    
                    // Pagination buttons
                    $('.page-btn').on('click', function() {
                        params.page = parseInt($(this).data('page'));
                        fetchListings();
                    });
                })
                .catch(error => {
                    console.error("Error loading listings:", error);
                    listingsContainer.html('<p>Error loading listings</p>');
                });
        }
    
        // Initial fetch
        fetchListings();
    
        // Search handler
        searchButton.on('click', () => {
            params.search = searchInput.val().trim();
            params.page = 1; // Reset to first page
            fetchListings();
        });
    
        searchInput.on('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });

        const filterOptions = document.querySelectorAll('.filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove "selected" from all options then add to the clicked one
                filterOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                const selectedCategory = option.getAttribute('data-category');
                
                params.category = selectedCategory === 'all' ? null : selectedCategory;
                params.page = 1;
                fetchListings();
            });
        });
    }

    async function loadListingDetailsPage() {
        const listingId = window.location.pathname.split('/')[2];
        const listingContainer = $('#listing-details');
        
        try {
            const listing = await ListingService.getListingById(listingId);
            if (listing) {
                let picturesHtml = '';
                for (let i = 1; i <= 10; i++) {
                    const pictureKey = `picture${i}`;
                    if (listing[pictureKey]) {
                        picturesHtml += `<img src="${listing[pictureKey]}" alt="${listing.title} picture ${i}" style="max-width: 300px; max-height: 300px; margin: 10px;">`;
                    }
                }
                
                const author = await UserProfileService.getUserProfile(listing.userId);
                let listingHtml = `
                    <h2>${listing.title}</h2>
                    <p><strong>Price:</strong> ${listing.price.toFixed(2)} EUR</p>
                    <p><strong>Description:</strong> ${listing.description || 'No description available'}</p>
                    <p><strong>Category:</strong> ${listing.category || 'None'}</p>
                    <p><strong>Posted by:</strong> <a href="/profile/${listing.userId}">${author.userName}</a></p>
                    <div class="listing-pictures">${picturesHtml}</div>
                `;
                
                const currentUser = CacheService.get("current_user");
                if (currentUser && currentUser.id === listing.userId) {
                    listingHtml += `<button id="edit-listing-btn">Edit Listing</button>`;
                }
                
                listingContainer.html(listingHtml);
                
                // Edit Listing handler
                const editBtn = document.getElementById("edit-listing-btn");
                if (editBtn) {
                    editBtn.addEventListener("click", () => {
                        // Build edit form with current data as placeholder and image previews
                        let editFormHtml = `
                            <h3>Edit Listing</h3>
                            <form id="edit-listing-form">
                                <div>
                                    <label for="edit-name">Title:</label>
                                    <input type="text" id="edit-name" name="name" value="${listing.title}" required>
                                </div>
                                <div>
                                    <label for="edit-description">Description:</label>
                                    <textarea id="edit-description" name="description" required>${listing.description}</textarea>
                                </div>
                                <div>
                                    <label for="edit-price">Price (EUR):</label>
                                    <input type="number" id="edit-price" name="price" step="0.01" min="0" value="${listing.price}" required>
                                </div>
                                <div>
                                    <label for="edit-category">Category:</label>
                                    <select id="edit-category" name="category" required>
                                        <option value="">Select a category</option>
                                        <option value="Electronics" ${listing.category==='Electronics' ? 'selected' : ''}>Electronics</option>
                                        <option value="Furniture" ${listing.category==='Furniture' ? 'selected' : ''}>Furniture</option>
                                        <option value="Clothing" ${listing.category==='Clothing' ? 'selected' : ''}>Clothing</option>
                                        <option value="Vehicles" ${listing.category==='Vehicles' ? 'selected' : ''}>Vehicles</option>
                                        <option value="Real Estate" ${listing.category==='Real Estate' ? 'selected' : ''}>Real Estate</option>
                                        <option value="Sports" ${listing.category==='Sports' ? 'selected' : ''}>Sports</option>
                                        <option value="Books" ${listing.category==='Books' ? 'selected' : ''}>Books</option>
                                        <option value="Other" ${listing.category==='Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="edit-pictures">Pictures (up to 10):</label>
                                    <input type="file" id="edit-pictures" name="pictures" accept="image/*" multiple>
                                    <div id="edit-preview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">`;
                        
                        // Prepopulate existing images
                        for (let i = 1; i <= 10; i++) {
                            const picKey = `picture${i}`;
                            if (listing[picKey]) {
                                editFormHtml += `<img src="${listing[picKey]}" alt="Picture ${i}" style="max-width: 100px; max-height: 100px;">`;
                            }
                        }
                        
                        editFormHtml += `       </div>
                                </div>
                                <button type="submit">Save Changes</button>
                            </form>
                            <div id="edit-form-message"></div>
                        `;
                        listingContainer.html(editFormHtml);
        
                        const editPicturesInput = document.getElementById('edit-pictures');
                        const editPreviewDiv = document.getElementById('edit-preview');
        
                        // Handle new picture previews
                        editPicturesInput.addEventListener('change', async () => {
                            editPreviewDiv.innerHTML = ''; // Clear previews
                            const files = editPicturesInput.files;
                
                            if (files.length > 10) {
                                alert('You can upload a maximum of 10 images.');
                                editPicturesInput.value = '';
                                return;
                            }
                
                            for (const file of files) {
                                if (!file.type.startsWith('image/')) {
                                    alert('Only image files are allowed.');
                                    editPicturesInput.value = '';
                                    editPreviewDiv.innerHTML = '';
                                    return;
                                }
                                const img = document.createElement('img');
                                img.src = URL.createObjectURL(file);
                                img.style.maxWidth = '100px';
                                img.style.maxHeight = '100px';
                                editPreviewDiv.appendChild(img);
                            }
                        });
        
                        // Edit form submission
                        document.getElementById('edit-listing-form').addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const editFormMessage = document.getElementById('edit-form-message');
                            editFormMessage.textContent = '';

                            const editFiles = editPicturesInput.files;
                            const pictureData = {};

                            // Process new image uploads if provided
                            try {
                                if (editFiles.length > 0) {
                                    for (let i = 0; i < Math.min(editFiles.length, 10); i++) {
                                        const file = editFiles[i];
                                        const base64String = await resizeAndConvertToBase64(file, 800, 0.7);
                                        pictureData[`Picture${i + 1}`] = base64String;
                                    }
                                } else {
                                    // No new images were uploaded, so use existing listing pictures.
                                    for (let i = 1; i <= 10; i++) {
                                        // Assuming your listing object contains keys 'picture1', 'picture2', etc.
                                        if (listing[`picture${i}`]) {
                                            pictureData[`Picture${i}`] = listing[`picture${i}`];
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('Image processing error:', error);
                                editFormMessage.textContent = 'Error processing images.';
                                editFormMessage.style.color = 'red';
                                return;
                            }

                            const data = {
                                Title: document.getElementById('edit-name').value,
                                Description: document.getElementById('edit-description').value,
                                Price: parseFloat(document.getElementById('edit-price').value),
                                Category: document.getElementById('edit-category').value || null,
                                UserId: currentUser.id,
                                ...pictureData
                            };

                            try {
                                const response = await ListingService.updateListing(listing.id, data);
                                if (response) {
                                    editFormMessage.textContent = 'Listing updated successfully!';
                                    editFormMessage.style.color = 'green';
                                    // Reload updated listing details
                                    loadListingDetailsPage();
                                } else {
                                    editFormMessage.textContent = 'Failed to update listing. Please try again.';
                                    editFormMessage.style.color = 'red';
                                }
                            } catch (error) {
                                console.error('Update listing error:', error);
                                editFormMessage.textContent = 'Error updating listing.';
                                editFormMessage.style.color = 'red';
                            }
                        });
                    });
                }
            } else {
                listingContainer.html('<p>Listing not found.</p>');
            }
        } catch (error) {
            console.error('Error loading listing details:', error);
            listingContainer.html('<p>Error loading listing details.</p>');
        }
    }

    function loadCreateListingPage() {
        const form = document.getElementById('create-listing-form');
        const picturesInput = document.getElementById('pictures');
        const previewDiv = document.getElementById('preview');
    
        picturesInput.addEventListener('change', async () => {
            previewDiv.innerHTML = ''; // Clear previous previews
            const files = picturesInput.files;
    
            if (files.length > 10) {
                alert('You can upload a maximum of 10 images.');
                picturesInput.value = ''; // Clear the input
                return;
            }
    
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    alert('Only image files are allowed.');
                    picturesInput.value = ''; // Clear the input
                    previewDiv.innerHTML = '';
                    return;
                }
    
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                previewDiv.appendChild(img);
            }
        });
    
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.textContent = '';
    
            const files = picturesInput.files;
            const pictureData = {};
    
            try {
                for (let i = 0; i < Math.min(files.length, 10); i++) {
                    const file = files[i];
                    const base64String = await resizeAndConvertToBase64(file, 800, 0.7); // Resize to max 800px, 70% quality
                    pictureData[`Picture${i + 1}`] = base64String;
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
                UserId: CacheService.get('current_user')?.id,
                ...pictureData // Spread the picture fields (Picture1, Picture2, etc.)
            };
    
            try {
                const response = await ListingService.createListing(data);
                if (response) {
                    formMessage.textContent = 'Listing created successfully!';
                    formMessage.style.color = 'green';
                    form.reset();
                    previewDiv.innerHTML = ''; // Clear image previews
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
    }
    
    async function resizeAndConvertToBase64(file, maxSize, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
    
            reader.onload = (e) => {
                img.src = e.target.result;
    
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
    
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
    
                    canvas.width = width;
                    canvas.height = height;
    
                    ctx.drawImage(img, 0, 0, width, height);
    
                    const base64String = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64String);
    
                    URL.revokeObjectURL(img.src);
                };
    
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
            };
    
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
    
            reader.readAsDataURL(file);
        });
    }

    const path = window.location.pathname;
    if (path.startsWith('/profile/')) {
        loadContent('My Profile');
    } else if (path === '/create') {
        loadContent('Create Listing');
    } else if (path.startsWith('/listing/')) {
        loadContent('Listing Details');
    } else {
        loadContent('Home');
    }

    $('#home').click(function(e) {
        e.preventDefault();
        loadContent('Home');
        history.pushState({}, '', '/');
    });

    $('#create').click(function(e) {
        e.preventDefault();
        loadContent('Create Listing');
        history.pushState({}, '', '/create');
    });

    const currentUser = CacheService.get("current_user");
    if (currentUser && currentUser.id) {
        $("#create").show();
    }

    $('#profile').click(function(e) {
        e.preventDefault();
        if (currentUser && currentUser.id) {
            loadContent('My Profile');
            history.pushState({}, '', `/profile/${currentUser.id}`);
        } else {
            $('#content').html(`<h1>No User Logged In</h1>
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
                </div>`);
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
});