import { UserProfileService } from '../services/userProfileService.js';
import { CacheService } from '../services/cacheService.js';
import { ListingService } from '../services/listingService.js';

export class ListingPage {

    async show()
    {
        const listingId = window.location.pathname.split('/')[2];
        const listingContainer = $('#listing-details');
        
        try {
            const listing = await ListingService.getListingById(listingId);
            if (listing) {
                let pictures = await ListingService.getListingPictures(listingId);

                let carouselHtml = '';
                if (pictures.length > 0) {
                    carouselHtml = `
                        <div class="carousel-container">
                            <div class="carousel-main">
                                <img id="carousel-big-img" src="${pictures[0]}" alt="Main Image" />
                                <div class="carousel-thumbnails">
                                    ${pictures.map((src, idx) => `
                                        <img class="carousel-thumb${idx === 0 ? ' selected' : ''}" src="${src}" data-idx="${idx}" alt="Thumbnail ${idx + 1}" />
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                const author = await UserProfileService.getUserProfile(listing.userId);
                let listingHtml = `
                    ${carouselHtml}
                    <div class="listing-details-info">
                        <h2>${listing.title}</h2>
                        <p><strong>Location:</strong> ${listing.location || 'Location not specified'}</p>
                        <p><strong>Price:</strong> ${listing.price.toFixed(2)} EUR</p>
                        <p><strong>Description:</strong> ${listing.description || 'No description available'}</p>
                        <p><strong>Category:</strong> ${listing.category || 'None'} | <strong>Posted by:</strong> <a href="/profile/${listing.userId}">${author.userName}</a></p>
                `;

                const currentUser = CacheService.get("current_user");
                if (currentUser && currentUser.id === listing.userId) {
                    listingHtml += `<div class="listing-buttons"><button id="edit-listing-btn">Edit Listing</button><button id="delete-listing-btn">Delete Listing</button></div>`;
                }
                else{
                    if (currentUser) {
                        if (author.phoneNumber) {
                            listingHtml += `
                                <p id="listing-contact">
                                    <strong>Phone: </strong> ${author.phoneNumber}
                                    <button class="copy-btn" data-text="${author.phoneNumber}" title="Copy phone number">
                                        <span class="material-symbols-outlined">content_copy</span>
                                    </button>
                                </p>`;
                        } else if (author.email) {
                            listingHtml += `
                                <p id="listing-contact">
                                    <strong>Email: </strong> ${author.email}
                                    <button class="copy-btn" data-text="${author.email}" title="Copy email">
                                        <span class="material-symbols-outlined">content_copy</span>
                                    </button>
                                </p>`;
                        }
                    } else {
                        listingHtml += `<p><em>Log in to see contact details.</em></p>`;
                    }
                }
                listingHtml += `</div>`;
                
                listingContainer.html(listingHtml);
                
                // Add click event listener for copy buttons
                $('.copy-btn').on('click', function(e) {
                    e.preventDefault();
                    let textToCopy = $(this).data('text');
                    const button = this;
                    
                    // Remove whitespaces from phone numbers (keep spaces for emails)
                    if (textToCopy && textToCopy.includes('+356')) {
                        textToCopy = textToCopy.replace(/\s/g, '');
                    }
                    
                    navigator.clipboard.writeText(textToCopy).then(function() {
                        // Show temporary success message
                        const originalContent = button.innerHTML;
                        button.innerHTML = '<span class="material-symbols-outlined success">check</span>';
                        setTimeout(() => {
                            button.innerHTML = originalContent;
                        }, 1500);
                    }).catch(function(err) {
                        console.error('Failed to copy: ', err);
                        
                        // Fallback method for older browsers
                        try {
                            const textArea = document.createElement('textarea');
                            textArea.value = textToCopy;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            
                            // Show success feedback
                            const originalContent = button.innerHTML;
                            button.innerHTML = '<span class="material-symbols-outlined">check</span>';
                            setTimeout(() => {
                                button.innerHTML = originalContent;
                            }, 1500);
                        } catch (fallbackErr) {
                            alert('Failed to copy to clipboard. Please copy manually: ' + textToCopy);
                        }
                    });
                });
                
                $('.carousel-thumb').on('click', function() {
                    const idx = $(this).data('idx');
                    $('#carousel-big-img').attr('src', pictures[idx]);
                    $('.carousel-thumb').removeClass('selected');
                    $(this).addClass('selected');
                });

                // Edit Listing handler
                const editBtn = document.getElementById("edit-listing-btn");
                if (editBtn) {
                    editBtn.addEventListener("click", () => this.showEditForm(listing));
                }

                // Delete Listing handler
                const deleteBtn = document.getElementById("delete-listing-btn");
                if (deleteBtn) {
                    deleteBtn.addEventListener("click", () => this.confirmDelete(listing.id));
                }
            } else {
                listingContainer.html('<p>Listing not found.</p>');
            }
        } catch (error) {
            console.error('Error fetching listing details:', error);
            listingContainer.html('<p>An error occurred while loading the listing details. Please try again later.</p>');
        }
    }
    
    async confirmDelete(listingId) {
        if (confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
            try {
                await ListingService.deleteListing(listingId);
                window.location.href = "/";
            } catch (error) {
                console.error("Error deleting listing:", error);
                alert("Failed to delete listing.");
            }
        }
    }

    async showEditForm(listing) {
        // Implementation for showing the edit form goes here
    }
}
