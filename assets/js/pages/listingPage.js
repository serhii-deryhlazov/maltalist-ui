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
                        <p><strong>Price:</strong> ${listing.price.toFixed(2)} EUR</p>
                        <p><strong>Description:</strong> ${listing.description || 'No description available'}</p>
                        <p><strong>Category:</strong> ${listing.category || 'None'} | <strong>Posted by:</strong> <a href="/profile/${listing.userId}">${author.userName}</a></p>
                `;

                const currentUser = CacheService.get("current_user");
                if (currentUser && currentUser.id === listing.userId) {
                    listingHtml += `<button id="edit-listing-btn">Edit Listing</button>`;
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
            } else {
                listingContainer.html('<p>Listing not found.</p>');
            }
        } catch (error) {
            console.error('Error loading listing details:', error);
            listingContainer.html('<p>Error loading listing details.</p>');
        }
    }

    showCreate(){
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
                        const processedImage = await ListingPage.processImage(file);
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
    }

    showEditForm(listing){
        const listingContainer = $('#listing-details');
        
        // Get existing pictures for the listing
        const listingId = listing.id;
        
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
                        <option value="Sports&Hobby" ${listing.category==='Sports&Hobby' ? 'selected' : ''}>Sports&Hobby</option>
                        <option value="Books" ${listing.category==='Books' ? 'selected' : ''}>Books</option>
                        <option value="Other" ${listing.category==='Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div>
                    <label for="edit-location">Location:</label>
                    <input type="text" id="edit-location" name="location" value="${listing.location || ''}" placeholder="Enter location">
                </div>
                <div>
                    <label>Pictures (up to 10):</label>
                    <div id="edit-picture-inputs" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
                </div>
                <button type="submit">Save Changes</button>
            </form>
            <div id="edit-form-message"></div>
        `;
        listingContainer.html(editFormHtml);

        // Load existing pictures and setup form
        this.setupEditForm(listing, listingId);
    }

    async setupEditForm(listing, listingId) {
        try {
            // Get existing pictures
            const existingPictures = await ListingService.getListingPictures(listingId);
            
            // Picture input logic
            const editPictureInputsDiv = document.getElementById('edit-picture-inputs');
            const editPictureFiles = Array(10).fill(null);

            for (let i = 0; i < 10; i++) {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.width = '100px';
                wrapper.style.height = '100px';

                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.style.width = '100px';
                input.style.height = '100px';
                input.style.opacity = 1;
                input.dataset.idx = i;

                const preview = document.createElement('img');
                preview.style.display = 'none';
                preview.style.position = 'absolute';
                preview.style.top = '0';
                preview.style.left = '0';
                preview.style.width = '100px';
                preview.style.height = '100px';
                preview.style.objectFit = 'cover';
                preview.style.borderRadius = '6px';

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

                // Prepopulate with existing image if present
                if (existingPictures && existingPictures[i]) {
                    preview.src = existingPictures[i];
                    preview.style.display = 'block';
                    delBtn.style.display = 'block';
                    editPictureFiles[i] = null; // Will use existing image unless replaced
                }

                // Handle file input change
                input.addEventListener('change', function() {
                    const idx = parseInt(this.dataset.idx);
                    if (this.files && this.files[0]) {
                        const file = this.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Only image files are allowed.');
                            this.value = '';
                            preview.style.display = 'none';
                            delBtn.style.display = 'none';
                            editPictureFiles[idx] = null;
                            return;
                        }
                        preview.src = URL.createObjectURL(file);
                        preview.style.display = 'block';
                        delBtn.style.display = 'block';
                        editPictureFiles[idx] = file;
                    } else {
                        preview.style.display = 'none';
                        delBtn.style.display = 'none';
                        editPictureFiles[idx] = null;
                    }
                });

                // Handle delete button
                delBtn.addEventListener('click', function() {
                    input.value = '';
                    preview.style.display = 'none';
                    delBtn.style.display = 'none';
                    editPictureFiles[i] = null;
                    // Clear the existing picture reference
                    if (existingPictures && existingPictures[i]) {
                        existingPictures[i] = null;
                    }
                });

                wrapper.appendChild(input);
                wrapper.appendChild(preview);
                wrapper.appendChild(delBtn);
                editPictureInputsDiv.appendChild(wrapper);
            }

            // Edit form submission
            document.getElementById('edit-listing-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const editFormMessage = document.getElementById('edit-form-message');
                editFormMessage.textContent = '';

                // Validate required fields
                const title = document.getElementById('edit-name').value.trim();
                const description = document.getElementById('edit-description').value.trim();
                const price = parseFloat(document.getElementById('edit-price').value);
                
                if (!title || !description || isNaN(price) || price < 0) {
                    editFormMessage.textContent = 'Please fill in all required fields with valid values.';
                    editFormMessage.style.color = 'red';
                    return;
                }

                // Prepare pictures for upload - detect if we need to handle deletions
                const currentPictureState = [];
                let hasChanges = false;
                
                // Check the current state of pictures in the form
                for (let i = 0; i < 10; i++) {
                    if (editPictureFiles[i]) {
                        // New file uploaded at this position
                        currentPictureState.push({ type: 'new', file: editPictureFiles[i] });
                        hasChanges = true;
                    } else if (existingPictures[i] && existingPictures[i] !== null) {
                        // Existing picture still present
                        currentPictureState.push({ type: 'existing', url: existingPictures[i] });
                    } else {
                        // Empty slot
                        currentPictureState.push(null);
                    }
                }
                
                // Check if any existing pictures were deleted
                const originalCount = existingPictures.filter(p => p).length;
                const currentExistingCount = currentPictureState.filter(p => p && p.type === 'existing').length;
                if (currentExistingCount < originalCount) {
                    hasChanges = true;
                }
                
                // Only collect files that should remain (both new and existing)
                const allFilesToKeep = [];
                for (const state of currentPictureState) {
                    if (state) {
                        if (state.type === 'new') {
                            allFilesToKeep.push(state.file);
                        } else if (state.type === 'existing') {
                            // For existing files, we need to download and convert to File objects
                            try {
                                const response = await fetch(state.url);
                                const blob = await response.blob();
                                const fileName = state.url.split('/').pop() || `existing_${Date.now()}.jpg`;
                                const file = new File([blob], fileName, { type: blob.type });
                                allFilesToKeep.push(file);
                            } catch (err) {
                                console.error('Error downloading existing picture:', err);
                            }
                        }
                    }
                }

                console.log('Pictures to keep:', allFilesToKeep.length, 'Has changes:', hasChanges);

                const data = {
                    Title: title,
                    Description: description,
                    Price: price,
                    Category: document.getElementById('edit-category').value || null,
                    Location: document.getElementById('edit-location').value || null,
                    UserId: CacheService.get("current_user").id
                };

                console.log('Sending update data:', data);

                try {
                    // Update listing data
                    const response = await ListingService.updateListing(listing.id, data);
                    if (response) {
                        // Update pictures if there are any changes (additions or deletions)
                        if (hasChanges) {
                            try {
                                // Use updateListingPictures to replace all pictures with the current set
                                await ListingService.updateListingPictures(listing.id, allFilesToKeep);
                                editFormMessage.textContent = 'Listing and pictures updated successfully!';
                                editFormMessage.style.color = 'green';
                            } catch (imgErr) {
                                console.error('Error updating images:', imgErr);
                                editFormMessage.textContent = 'Listing updated, but image update failed.';
                                editFormMessage.style.color = 'orange';
                            }
                        } else {
                            editFormMessage.textContent = 'Listing updated successfully!';
                            editFormMessage.style.color = 'green';
                        }
                        
                        setTimeout(() => {
                            window.location.href = `/listing/${listing.id}`;
                        }, 1500);
                    } else {
                        editFormMessage.textContent = 'Failed to update listing. Please try again.';
                        editFormMessage.style.color = 'red';
                    }
                } catch (error) {
                    console.error('Update listing error:', error);
                    if (error.message && error.message.includes('400')) {
                        editFormMessage.textContent = 'Invalid data. Please check all fields and try again.';
                    } else {
                        editFormMessage.textContent = 'Error updating listing.';
                    }
                    editFormMessage.style.color = 'red';
                }
            });
            
        } catch (error) {
            console.error('Error loading existing pictures:', error);
            document.getElementById('edit-form-message').textContent = 'Error loading existing pictures.';
            document.getElementById('edit-form-message').style.color = 'red';
        }
    }

    static async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const MAX_WIDTH = 800, MAX_HEIGHT = 800;
                    let width = img.width, height = img.height;

                    if (width > height && width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    } else if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: "image/jpeg" }));
                        } else {
                            reject(new Error("Image processing failed."));
                        }
                    }, "image/jpeg", 0.7);
                };
                img.onerror = () => reject(new Error("Failed to load image."));
                img.src = readerEvent.target.result;
            };
            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsDataURL(file);
        });
    }
}