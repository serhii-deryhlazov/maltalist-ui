import { UserProfileService } from '../services/userProfileService.js';
import { CacheService } from '../services/cacheService.js';
import { ListingService } from '../services/listingService.js';

export class ListingPage {

    async show()
    {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('promotion') === 'success') {
            const listingId = parseInt(urlParams.get('listing'));
            const type = urlParams.get('type');
            const expirationDate = new Date();
            if (type === 'week') {
                expirationDate.setDate(expirationDate.getDate() + 7);
            } else {
                expirationDate.setMonth(expirationDate.getMonth() + 1);
            }
            // Get listing to get category
            const listing = await ListingService.getListingById(listingId);
            if (listing) {
                await fetch('/api/Promotions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listingId: listingId,
                        expirationDate: expirationDate.toISOString(),
                        category: listing.category
                    })
                });
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
                alert('Listing promoted successfully!');
            }
        }

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
                        <p class="listing-category">
                            <span><strong>Category:</strong> ${listing.category || 'None'}</span>
                            <span><strong>Posted by:</strong> <a href="/profile/${listing.userId}">${author.userName}</a></span>
                        </p>
                `;

                const currentUser = CacheService.get("current_user");
                if (currentUser && currentUser.id === listing.userId) {
                    listingHtml += `<div class="listing-buttons"><button id="edit-listing-btn">Edit Listing</button><button id="delete-listing-btn">Delete Listing</button><button id="promote-listing-btn">Promote Listing</button></div>`;
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
                    editBtn.addEventListener("click", () => this.showEditForm(listing, listingContainer));
                }

                // Delete Listing handler
                const deleteBtn = document.getElementById("delete-listing-btn");
                if (deleteBtn) {
                    deleteBtn.addEventListener("click", () => this.confirmDelete(listing.id));
                }

                // Promote Listing handler
                const promoteBtn = document.getElementById("promote-listing-btn");
                if (promoteBtn) {
                    promoteBtn.addEventListener("click", () => this.promoteListing(listing.id));
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

    async promoteListing(listingId) {
        // Show modal with promotion options
        const modal = document.createElement('div');
        modal.id = 'promotion-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Promote Listing</h3>
                <select id="promotion-type">
                    <option value="week">1 Week - 2 EUR</option>
                    <option value="month">1 Month - 5 EUR</option>
                </select>
                <button id="confirm-promotion">Confirm & Pay</button>
                <button id="cancel-promotion">Cancel</button>
            </div>
        `;
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        `;
        modal.querySelector('.modal-content').style.cssText = `
            background: white; padding: 20px; border-radius: 8px; text-align: center;
        `;
        document.body.appendChild(modal);

        document.getElementById('cancel-promotion').addEventListener('click', () => modal.remove());

        document.getElementById('confirm-promotion').addEventListener('click', async () => {
            const type = document.getElementById('promotion-type').value;
            const priceId = type === 'week' ? 'price_1S84D4CjFdJ7izyJ7cddtZCf' : 'price_1S84D4CjFdJ7izyJWk98XDT4'; // Stripe Price IDs
            // Use Stripe for payment
            const stripe = Stripe('pk_test_51S7JlICjFdJ7izyJ4a9AJUPconADc29JQKxPX8MpAfM56xvONX6HfSDgpvs5I32RZjaBq1uxCzrIbwxzzfpFIAGy00e9WUDWHI'); // Replace with your test publishable key
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId, quantity: 1 }],
                mode: 'payment',
                successUrl: window.location.href + '?promotion=success&listing=' + listingId + '&type=' + type,
                cancelUrl: window.location.href,
            });
            if (error) {
                alert('Payment failed: ' + error.message);
            }
        });
    }

  showEditForm(listing, listingContainer){
        // Build edit form with current data as placeholder and image previews
        let editFormHtml = `
            <style>
                #edit-listing-form {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 30px;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                #edit-listing-form h3 {
                    text-align: center;
                    color: #004779;
                    margin-bottom: 30px;
                    font-size: 1.8rem;
                    font-weight: 600;
                }

                #edit-listing-form div {
                    margin-bottom: 20px;
                }

                #edit-listing-form label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                    font-size: 0.95rem;
                }

                #edit-listing-form input,
                #edit-listing-form textarea,
                #edit-listing-form select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                    background: #fff;
                }

                #edit-listing-form input:focus,
                #edit-listing-form textarea:focus,
                #edit-listing-form select:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }

                #edit-listing-form textarea {
                    resize: vertical;
                    min-height: 120px;
                }

                #edit-listing-form select {
                    cursor: pointer;
                }

                #edit-picture-inputs {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }

                .picture-upload-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #fafafa;
                    margin: 5px;
                }

                .picture-upload-wrapper:hover {
                    border-color: #007bff;
                    background: #f0f8ff;
                }

                .picture-upload-wrapper.has-image {
                    border-style: solid;
                    border-color: #28a745;
                    background: #f8fff8;
                }

                .upload-placeholder {
                    font-size: 36px;
                    color: #999;
                    font-weight: bold;
                    pointer-events: none;
                }

                .picture-upload-input {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }

                .picture-upload-wrapper img {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 6px;
                    object-fit: cover;
                }

                .remove-btn {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #dc3545;
                    color: white;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .remove-btn:hover {
                    background: #c82333;
                }

                #edit-listing-form button[type="submit"] {
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #004779 0%, #0066a0 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                #edit-listing-form button[type="submit"]:hover {
                    background: linear-gradient(135deg, #003d63 0%, #005280 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 71, 121, 0.3);
                }

                #edit-listing-form button[type="submit"]:active {
                    transform: translateY(0);
                }

                #edit-form-message {
                    text-align: center;
                    margin-top: 20px;
                    padding: 12px;
                    border-radius: 6px;
                    font-weight: 500;
                    min-height: 20px;
                }

                #edit-form-message.success {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }

                #edit-form-message.error {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }

                @media (max-width: 600px) {
                    #edit-listing-form {
                        padding: 20px;
                        margin: 10px;
                    }

                    #edit-picture-inputs {
                        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                        gap: 10px;
                    }

                    .picture-upload-wrapper {
                        width: 100px;
                        height: 100px;
                    }
                }
            </style>

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
                        <option value="Sports&Hobby" ${listing.category==='Sports&Hobby' ? 'selected' : ''}>Sports&Hobby</option>
                        <option value="Books" ${listing.category==='Books' ? 'selected' : ''}>Books</option>
                        <option value="Other" ${listing.category==='Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div>
                    <label for="edit-location">Location:</label>
                    <input type="text" id="edit-location" name="location" value="${listing.location || ''}" required>
                </div>
                <div>
                    <label>Add New Pictures (up to 10):</label>
                    <div id="edit-picture-inputs"></div>
                </div>
                <button type="submit">Save Changes</button>
            </form>
            <div id="edit-form-message"></div>
        `;
        listingContainer.html(editFormHtml);

        // Picture input logic
        const editPictureInputsDiv = document.getElementById('edit-picture-inputs');
        const editPictureFiles = Array(10).fill(null);

        for (let i = 0; i < 10; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'picture-upload-wrapper';

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.className = 'picture-upload-input';
            input.dataset.idx = i;

            const placeholder = document.createElement('div');
            placeholder.className = 'upload-placeholder';
            placeholder.innerHTML = '+';

            const preview = document.createElement('img');
            preview.style.display = 'none';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.style.display = 'none';

            // Handle file input change
            input.addEventListener('change', function() {
                const idx = parseInt(this.dataset.idx);
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    if (!file.type.startsWith('image/')) {
                        alert('Only image files are allowed.');
                        this.value = '';
                        preview.style.display = 'none';
                        placeholder.style.display = 'block';
                        removeBtn.style.display = 'none';
                        editPictureFiles[idx] = null;
                        wrapper.classList.remove('has-image');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                        placeholder.style.display = 'none';
                        removeBtn.style.display = 'block';
                        wrapper.classList.add('has-image');
                    };
                    reader.readAsDataURL(file);

                    editPictureFiles[idx] = file;
                } else {
                    preview.style.display = 'none';
                    placeholder.style.display = 'block';
                    removeBtn.style.display = 'none';
                    editPictureFiles[idx] = null;
                    wrapper.classList.remove('has-image');
                }
            });

            // Handle remove button
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                input.value = '';
                preview.style.display = 'none';
                placeholder.style.display = 'block';
                removeBtn.style.display = 'none';
                editPictureFiles[i] = null;
                wrapper.classList.remove('has-image');
            });

            // Handle wrapper click to trigger file input
            wrapper.addEventListener('click', function() {
                input.click();
            });

            wrapper.appendChild(input);
            wrapper.appendChild(placeholder);
            wrapper.appendChild(preview);
            wrapper.appendChild(removeBtn);
            editPictureInputsDiv.appendChild(wrapper);
        }

        // Edit form submission
        document.getElementById('edit-listing-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const editFormMessage = document.getElementById('edit-form-message');
            editFormMessage.textContent = '';

            try {
                // First update the basic listing data
                const basicData = {
                    title: document.getElementById('edit-name').value,
                    description: document.getElementById('edit-description').value,
                    price: parseFloat(document.getElementById('edit-price').value),
                    category: document.getElementById('edit-category').value,
                    location: document.getElementById('edit-location').value,
                    userId: CacheService.get("current_user").id
                };

                const response = await ListingService.updateListing(listing.id, basicData);
                
                // Then handle pictures if any new ones were uploaded
                const newPictures = editPictureFiles.filter(file => file !== null);
                if (newPictures.length > 0) {
                    await ListingService.addListingPictures(listing.id, newPictures);
                }

                if (response) {
                    editFormMessage.textContent = 'Listing updated successfully!';
                    editFormMessage.style.color = 'green';
                    setTimeout(() => {
                        this.show();
                    }, 1500);
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
    }

    static async showCreate() {
        const pictureInputs = $('#picture-inputs');
        pictureInputs.empty();

        // Create all 10 inputs but hide them initially
        for (let i = 0; i < 10; i++) {
            const pictureUpload = $(`
                <div class="picture-upload" id="upload-${i}" style="${i > 0 ? 'display: none;' : ''}">
                    <input type="file" id="picture-${i}" name="picture-${i}" accept="image/*">
                    <div class="picture-preview" data-for="picture-${i}">
                        <span>+</span>
                    </div>
                </div>
            `);
            pictureInputs.append(pictureUpload);
        }

        // Handle file selection and preview
        $('.picture-preview').on('click', function() {
            const inputId = $(this).data('for');
            $(`#${inputId}`).click();
        });

        $('input[type="file"]').on('change', function() {
            const file = this.files[0];
            const preview = $(`.picture-preview[data-for="${this.id}"]`);
            const currentIndex = parseInt(this.id.split('-')[1]);
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.html(`<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`);
                };
                reader.readAsDataURL(file);
                
                // Show next input if it exists and is hidden
                if (currentIndex < 9) {
                    $(`#upload-${currentIndex + 1}`).show();
                }
            } else {
                preview.html('<span>+</span>');
                
                // Hide subsequent inputs if this one is cleared
                for (let i = currentIndex + 1; i < 10; i++) {
                    const nextInput = $(`#picture-${i}`)[0];
                    if (!nextInput.files[0]) {
                        $(`#upload-${i}`).hide();
                    } else {
                        break; // Stop if we find a filled input
                    }
                }
            }
        });

        // Handle form submit
        $('#create-listing-form').on('submit', async (e) => {
            e.preventDefault();
            const currentUser = CacheService.get("current_user");
            if (!currentUser || !currentUser.id) {
                alert("You must be logged in to create a listing.");
                return;
            }
            const formData = new FormData(e.target);
            const data = {
                title: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                location: formData.get('location'),
                userId: currentUser.id
            };

            const pictures = [];
            for (let i = 0; i < 10; i++) {
                const file = formData.get(`picture-${i}`);
                if (file && file.size > 0) {
                    pictures.push(file);
                }
            }

            try {
                const response = await ListingService.createListing(data);
                if (response && response.id) {
                    if (pictures.length > 0) {
                        await ListingService.addListingPictures(response.id, pictures);
                    }
                    window.location.href = `/listing/${response.id}`;
                } else {
                    $('#form-message').text('Failed to create listing.');
                }
            } catch (error) {
                console.error('Error creating listing:', error);
                $('#form-message').text('An error occurred. Please try again.');
            }
        });
    }
}
