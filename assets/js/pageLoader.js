import { HomePage } from './pages/homePage.js';
import { ProfilePage } from './pages/profilePage.js';
import { ListingPage } from './pages/listingPage.js';

export class PageLoader {

    init() {
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
        const profilePage = new ProfilePage();
        console.log("Initializing profile page");
        profilePage.init(PageLoader.loadContent);
        const homePage = new HomePage();
        console.log("Initializing home page");
        homePage.init(PageLoader.loadContent);

        const path = window.location.pathname;

        if (path.startsWith('/profile/')) {
            console.log("Loading profile page for path:", path);
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