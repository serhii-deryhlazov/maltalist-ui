import { UserProfileService } from '/assets/js/services/userProfileService.js';
import { CacheService } from '/assets/js/services/cacheService.js';

$(document).ready(function() {
    function loadContent(page) {
        const pageFile = page.toLowerCase().replace(' ', '-') + '.html';
        const pageUrl = `/pages/${pageFile}`;
        
        $('#content').html(`<h1>Loading ${page}...</h1>`);
        
        $('#content').load(pageUrl, function(response, status, xhr) {
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
            }
            // No extra logic for 'My Profile'; my-profile.js handles it
        });
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

    function loadListingsPageData() {
        listingsService.getAllListings()
            .then(listings => {
                let listingsHtml = '<h1>All Listings</h1><ul>';
                listings.forEach(listing => {
                    listingsHtml += `<li>${listing.title}</li>`;
                });
                listingsHtml += '</ul>';
                $('#content').html(listingsHtml);
            })
            .catch(error => {
                console.error("Error loading listings:", error);
                $('#content').html('<h1>Error loading listings</h1>');
            });
    }

    function loadCreateListingPage() {
        const createListingForm = `
            <h1>Create Listing</h1>
            <form id="createListingForm">
                <div>
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div>
                    <label for="description">Description:</label>
                    <textarea id="description" name="description" required></textarea>
                </div>
                <div>
                    <label for="price">Price:</label>
                    <input type="number" id="price" name="price" required>
                </div>
                <div>
                    <label for="category">Category:</label>
                    <input type="text" id="category" name="category" required>
                </div>
                <button type="submit">Submit Listing</button>
            </form>
            <div id="formStatus"></div>
        `;
        $('#content').html(createListingForm);
        $('#createListingForm').on('submit', function(e) {
            e.preventDefault();
            const listingData = {
                title: $('#title').val(),
                description: $('#description').val(),
                price: $('#price').val(),
                category: $('#category').val()
            };
            listingsService.createListing(listingData)
                .then(response => {
                    $('#formStatus').html('<p>Listing created successfully!</p>');
                    $('#createListingForm')[0].reset();
                })
                .catch(error => {
                    console.error("Error creating listing:", error);
                    $('#formStatus').html('<p>Error creating listing. Please try again.</p>');
                });
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