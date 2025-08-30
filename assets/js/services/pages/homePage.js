import { ListingService } from '/assets/js/services/listingService.js';

export class HomePage {

    init(){
        $('#home').click(function(e) {
            e.preventDefault();
            this.loadContent('Home');
            history.pushState({}, '', '/');
        });
    }

    show(params = { page: 1, limit: 9 }) {
        const searchInput = $('<input type="text" id="search" placeholder="Search listings...">');
        const searchButton = $('<button>Search</button>');
        const tools = $('#search-bar');
        tools.append(searchInput);
        tools.append(searchButton);
    
        this.fetchListings();
    
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

    fetchListings() {
        const listingsContainer = $('#listing-list');
        listingsContainer.html('<p>Loading...</p>');
        ListingService.getAllListings(params)
            .then(response => {
                const { listings, totalNumber, page } = response;
                let listingsHtml = '<ul>';
                listings.forEach(listing => {
                    const picture = listing.picture1 || 'https://via.placeholder.com/100';
                    listingsHtml += `
                        <li>
                            <a href="/listing/${listing.id}">
                                <img src="${picture}" alt="${listing.title}">
                                <div>
                                    <h3>${listing.title}</h3>
                                    <p>${listing.description ? listing.description.substring(0, 100) + '...' : 'No description available'}</p>
                                    <p>${listing.price.toFixed(2)} EUR</p>
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
}