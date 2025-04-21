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

        window.onGoogleSignIn = async function (response) {
            try {
                const credential = response.credential;
                const user = await UserProfileService.verifyGoogleLogin(credential);
                if (user && user.id) {
                    CacheService.set("current_user", user);
                    console.log("Logged in as:", user);
                } else {
                    alert("Login failed on server.");
                }
            } catch (err) {
                console.error("Google login error:", err);
                alert("Google login failed.");
            }
        };

        if (!currentUser) {
            contentDiv.insertAdjacentHTML('afterbegin', googleSignInDiv);
        }

        if (profile) {
            let profileDetailsHTML = `
                <p>User: ${profile.userName}</p>
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
        } else {
            document.getElementById('profile-details').innerHTML = '<p>Profile not found.</p>';
        }
    }

    function loadHomePageData() {
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
                                    <p>Price: $${listing.price.toFixed(2)}</p>
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
                
                const listingHtml = `
                    <h2>${listing.title}</h2>
                    <p><strong>Price:</strong> $${listing.price.toFixed(2)}</p>
                    <p><strong>Description:</strong> ${listing.description || 'No description available'}</p>
                    <p><strong>Category:</strong> ${listing.category || 'None'}</p>
                    <p><strong>Posted by:</strong> <a href="/profile/${listing.userId}">${author.userName}</a></p>
                    <div class="listing-pictures">${picturesHtml}</div>
                `;
                listingContainer.html(listingHtml);
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

    $('#profile').click(function(e) {
        e.preventDefault();
        const currentUser = CacheService.get("current_user");
        if (currentUser && currentUser.id) {
            loadContent('My Profile');
            history.pushState({}, '', `/profile/${currentUser.id}`);
        } else {
            $('#content').html('<h1>No User Logged In</h1>');
        }
    });
});