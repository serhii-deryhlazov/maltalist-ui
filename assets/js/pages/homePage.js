import { ListingService } from '/assets/js/services/listingService.js';

export class HomePage {

    init(loadContent){
        // Event handling moved to PageLoader for better delegation
        // This method is kept for compatibility but handlers are set in PageLoader
    }

    show(params = { page: 1, limit: 9 }) {
        console.log('HomePage.show() called with params:', params);
        
        // Check if required DOM elements exist with retries
        const checkDOMAndShow = (retryCount = 0) => {
            const searchBar = $('#search-bar');
            const listingList = $('#listing-list');
            console.log(`Attempt ${retryCount + 1}: Search bar found:`, searchBar.length > 0);
            console.log(`Attempt ${retryCount + 1}: Listing list found:`, listingList.length > 0);
            
            if (searchBar.length === 0 || listingList.length === 0) {
                if (retryCount < 10) { // Try up to 10 times
                    console.log('Required DOM elements not found. Retrying in 200ms...');
                    setTimeout(() => checkDOMAndShow(retryCount + 1), 200);
                    return;
                } else {
                    console.error('Could not find required DOM elements after 10 retries');
                    return;
                }
            }

            // DOM elements are ready, set up the page
            this.setupPage(params);
        };

        checkDOMAndShow();
    }

    setupPage(params) {
        const searchInput = $('<input type="text" id="search" placeholder="Search listings...">');
        const searchButton = $('<button>Search</button>');
        const tools = $('#search-bar');
        tools.empty(); // Clear existing content
        tools.append(searchInput);
        tools.append(searchButton);
        this.fetchListings(params);
    
        // Sort handler
        $('#sort').on('change', () => {
            const sortValue = $('#sort').val();
            params.sort = sortValue;
            if (sortValue === 'distance') {
                $('#location-select').show();
                params.location = $('#location-select').val();
                // $('#sort-full').addClass('distance-mode');
            } else {
                $('#location-select').hide();
                delete params.location;
                // $('#sort-full').removeClass('distance-mode');
            }
            params.page = 1;
            this.fetchListings(params);
        });

        // Location handler for distance
        $('#location-select').on('change', () => {
            params.location = $('#location-select').val();
            params.page = 1;
            this.fetchListings(params);
        });
    
        // Search handler
        searchButton.on('click', () => {
            params.search = searchInput.val().trim();
            params.page = 1; // Reset to first page
            this.fetchListings(params);
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
                this.fetchListings(params);
            });
        });
    }

    fetchListings(params) {
        const listingsContainer = $('#listing-list');
        listingsContainer.html('<p>Loading...</p>');

        let allListings = [];
        let promotedIds = new Set();

        if (params.category) {
            ListingService.getPromotedListings(params.category)
            .then(async promoted => {
                allListings = promoted || [];
                promotedIds = new Set(allListings.map(l => l.id));
                return ListingService.getAllListings(params);
            })
            .then(async response => {
                const { listings, totalNumber, page } = response;
                // Add regular listings not already in promoted
                const regular = listings.filter(l => !promotedIds.has(l.id));
                allListings = allListings.concat(regular);

                const picturesList = await Promise.all(
                    allListings.map(l => ListingService.getListingPictures(l.id))
                );

                let listingsHtml = '<ul>';
                allListings.forEach((listing, idx) => {
                    const pictures = picturesList[idx];
                    const imageSrc = pictures && pictures.length > 0 ? pictures[0] : '/assets/img/placeholder.png';
                    const isPromoted = promotedIds.has(listing.id);
                    listingsHtml += `
                        <li class="${isPromoted ? 'promoted' : ''}">
                            <a href="/listing/${listing.id}">
                                <img src="${imageSrc}" alt="${listing.title}">
                                <div>
                                    <h3>${listing.title}${isPromoted ? ' <span class="promoted-badge">Promoted</span>' : ''}</h3>
                                    <p>${listing.description ? listing.description.substring(0, 100) + '...' : 'No description available'}</p>
                                    <div class="listing-meta">
                                        <div><span class="material-symbols-outlined">location_on</span>${listing.location || 'Location not specified'}</div>
                                        <div>${listing.price.toFixed(2)} EUR</div>
                                    </div>
                                </div>
                            </a>
                        </li>
                    `;
                });
                listingsHtml += '</ul>';

                // Pagination (simplified, since promoted are shown first)
                listingsContainer.html(listingsHtml);

                // For now, no pagination for promoted
            })
            .catch(error => {
                console.error("Error loading listings:", error);
                listingsContainer.html('<p>Error loading listings</p>');
            });
        } else {
            ListingService.getAllListings(params)
            .then(async response => {
                const { listings, totalNumber, page } = response;

                const picturesList = await Promise.all(
                    listings.map(l => ListingService.getListingPictures(l.id))
                );

                let listingsHtml = '<ul>';
                listings.forEach((listing, idx) => {
                    const pictures = picturesList[idx];
                    const imageSrc = pictures && pictures.length > 0 ? pictures[0] : '/assets/img/placeholder.png';
                    listingsHtml += `
                        <li>
                            <a href="/listing/${listing.id}">
                                <img src="${imageSrc}" alt="${listing.title}">
                                <div>
                                    <h3>${listing.title}</h3>
                                    <p>${listing.description ? listing.description.substring(0, 100) + '...' : 'No description available'}</p>
                                    <div class="listing-meta">
                                        <div><span class="material-symbols-outlined">location_on</span>${listing.location || 'Location not specified'}</div>
                                        <div>${listing.price.toFixed(2)} EUR</div>
                                    </div>
                                </div>
                            </a>
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
                $('.page-btn').on('click', (event) => {
                    params.page = parseInt($(event.target).data('page'));
                    this.fetchListings(params);
                });
            })
            .catch(error => {
                console.error("Error loading listings:", error);
                listingsContainer.html('<p>Error loading listings</p>');
            });
        }
    }

}