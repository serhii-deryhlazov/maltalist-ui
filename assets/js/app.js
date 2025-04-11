import { UserProfileService } from './services/userProfileService.js';
import { CacheService } from './services/cacheService.js';

$(document).ready(function() {
    function loadContent(page) {
        $('#content').html('<h1>Loading ' + page + '...</h1>');

        $('#content').load('pages/' + page.toLowerCase().replace(' ', '-') + '.html', function() {
            if (page === 'Home') {
                loadHomePageData();
            } else if (page === 'All Listings') {
                loadListingsPageData();
            } else if (page === 'Create Listing') {
                loadCreateListingPage();
            } else if (page === 'My Profile') {
                loadUserProfilePage();
            }
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
    
        // Handle form submission
        $('#createListingForm').on('submit', function(e) {
            e.preventDefault();  // Prevent form from submitting the traditional way
    
            const listingData = {
                title: $('#title').val(),
                description: $('#description').val(),
                price: $('#price').val(),
                category: $('#category').val()
            };
    
            // Call the service to submit the listing (replace with actual service call)
            listingsService.createListing(listingData)
                .then(response => {
                    $('#formStatus').html('<p>Listing created successfully!</p>');
                    $('#createListingForm')[0].reset();  // Reset form
                })
                .catch(error => {
                    $('#formStatus').html('<p>Error creating listing. Please try again.</p>');
                });
        });
    }

    function loadUserProfilePage() {
        const currentUser = CacheService.get("current_user");
        if (currentUser && currentUser.id) {
            userProfileService.getUserProfile(currentUser.id)
                .then(profile => {
                    $('#content').html('<h1>My Profile</h1><p>' + profile.name + '</p>');
                })
                .catch(error => {
                    $('#content').html('<h1>Error loading profile</h1>');
                });
        } else {
            $('#content').html('<h1>No User Logged In</h1>');
        }
    }

    // Load home page by default
    loadContent('Home');

    // Bind click events to navigation links
    $('#home').click(function() {
        loadContent('Home');
    });

    $('#listings').click(function() {
        loadContent('All Listings');
    });

    $('#create').click(function() {
        loadContent('Create Listing');
    });

    $('#profile').click(function() {
        const currentUser = CacheService.get("current_user");
        if (currentUser && currentUser.id) {
            window.location.href = `/profile/${currentUser.id}`;
        }
    });
});
