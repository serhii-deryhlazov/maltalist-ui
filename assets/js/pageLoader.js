import { HomePage } from './pages/homePage.js';
import { ProfilePage } from './pages/profilePage.js';
import { ListingPage } from './pages/listingPage.js';

export class PageLoader {

    async init() {
        await this.initRoutes();
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
        });
    }

    async initRoutes(){
        const listingPage = new ListingPage();

        const profilePage = new ProfilePage();
        profilePage.init(PageLoader.loadContent);

        const homePage = new HomePage();
        homePage.init(PageLoader.loadContent);

        const path = window.location.pathname;
        if (path.startsWith('/profile/')) {
            PageLoader.loadContent('My Profile');
            await profilePage.show(PageLoader.loadContent);
        } else if (path === '/create') {
            PageLoader.loadContent('Create Listing');
            await listingPage.showCreate();
        } else if (path.startsWith('/listing/')) {
            PageLoader.loadContent('Listing Details');
            await listingPage.show();
        } else {
            PageLoader.loadContent('Home');
            homePage.show();
        }
    }
}