import { HomePage } from './pages/homePage.js';
import { ProfilePage } from './pages/profilePage.js';
import { ListingPage } from './pages/listingPage.js';

export class PageLoader {

    profilePage = new ProfilePage();
    homePage = new HomePage();
    listingPage = new ListingPage();

    init() {
        this.profilePage.init();
        this.homePage.init();
        this.initRoutes();
    }

    loadContent(page) {
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
                this.homePage.show();
            } else if (page === 'Create Listing') {
                this.listingPage.showCreate();
            } else if (page === 'My Profile') {
                await this.profilePage.show();
            } else if (page === 'Listing Details') {
                await this.listingPage.show();
            }
        });
    }

    initRoutes(){
        const path = window.location.pathname;
        if (path.startsWith('/profile/')) {
            this.loadContent('My Profile');
        } else if (path === '/create') {
            this.loadContent('Create Listing');
        } else if (path.startsWith('/listing/')) {
            this.loadContent('Listing Details');
        } else {
            this.loadContent('Home');
        }
    }
}