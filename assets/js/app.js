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
            } else if (page === 'All Listings') {
                loadListingsPageData();
            } else if (page === 'Create Listing') {
                loadCreateListingPage();
            } else if (page === 'My Profile') {
                loadProfilePageData();
            }
        });
    }

    async function loadProfilePageData() {
        const userId = window.location.pathname.split('/')[2];
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        const profile = await UserProfileService.getUserProfile(userId);

        console.log("Current User:", currentUser);
        console.log("Profile Details:", profile);

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
    }

    function loadListingsPageData(params = { page: 1, limit: 10 }) {
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
                                    <h3>${listing.title}</h3>
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

    function loadCreateListingPage() {
        const form = document.getElementById('create-listing-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.textContent = '';
    
            const data = {
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                price: parseFloat(document.getElementById('price').value),
                category: document.getElementById('category').value || null,
                userId: CacheService.get("current_user")?.id
            };
    
            try {
                const response = await ListingService.createListing(data);
                if (response) {
                    formMessage.textContent = 'Listing created successfully!';
                    formMessage.style.color = 'green';
                    form.reset();
                    // Optionally redirect: window.location.href = '/listings';
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

    // Check URL on page load
    const path = window.location.pathname;
    if (path.startsWith('/profile/')) {
        loadContent('My Profile');
    } else if (path === '/listings') {
        loadContent('All Listings');
    } else if (path === '/create') {
        loadContent('Create Listing');
    } else {
        loadContent('Home');
    }

    // Bind click events to navigation links
    $('#home').click(function(e) {
        e.preventDefault();
        loadContent('Home');
        history.pushState({}, '', '/');
    });

    $('#listings').click(function(e) {
        e.preventDefault();
        loadContent('All Listings');
        history.pushState({}, '', '/listings');
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