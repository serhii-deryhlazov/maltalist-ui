import { HomePage } from './pages/homePage.js';
import { ProfilePage } from './pages/profilePage.js';
import { ListingPage } from './pages/listingPage.js';

export class PageLoader {

    profilePage = new ProfilePage();
    homePage = new HomePage();
    listingPage = new ListingPage();

    init() {
        this.profilePage.init(PageLoader.loadContent);
        this.homePage.init();
        this.initRoutes();
    }

    static async loadContent(page) {
        const pageFile = page.toLowerCase().replace(' ', '-') + '.html';
        const pageUrl = `/pages/${pageFile}`;
        
        $('#content').html(`<h1>Loading ${page}...</h1>`);
        
        $('#content').load(pageUrl, async (response, status, xhr) => {
            if (status === 'error') {
                console.error(`Failed to load ${pageUrl}: ${xhr.status} ${xhr.statusText}`);
                $('#content').html(`<h1>Error loading ${page}</h1>`);
                return;
            }
            
            const homePage = new HomePage();
            const profilePage = new ProfilePage();
            const listingPage = new ListingPage();

            if (page === 'Home') {
                homePage.show();
            } else if (page === 'Create Listing') {
                listingPage.showCreate();
            } else if (page === 'My Profile') {
                await profilePage.show();
            } else if (page === 'Listing Details') {
                await listingPage.show();
            }
        });
    }

    initRoutes(){
        const path = window.location.pathname;
        if (path.startsWith('/profile/')) {
            PageLoader.loadContent('My Profile');
        } else if (path === '/create') {
            PageLoader.loadContent('Create Listing');
        } else if (path.startsWith('/listing/')) {
            PageLoader.loadContent('Listing Details');
        } else {
            PageLoader.loadContent('Home');
        }
    }
}