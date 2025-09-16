import { HomePage } from './pages/homePage.js';
import { ProfilePage } from './pages/profilePage.js';
import { ListingPage } from './pages/listingPage.js';
import { CacheService } from './services/cacheService.js';
import { UserProfileService } from './services/userProfileService.js';

export class PageLoader {

    async init() {
        await this.initRoutes();
    }

    static async loadContent(page, callback) {
        const pageFile = page.toLowerCase().replace(' ', '-') + '.html';
        const pageUrl = `/pages/${pageFile}`;
        
        $('#content').html(`<h1>Loading ${page}...</h1>`);
        
        $('#content').load(pageUrl, async (response, status, xhr) => {
            if (status === 'error') {
                console.error(`Failed to load ${pageUrl}: ${xhr.status} ${xhr.statusText}`);
                $('#content').html(`<h1>Error loading ${page}</h1>`);
                return;
            }
            
            if (callback && typeof callback === 'function') {
                callback();
            }
        });
    }

    async initRoutes(){
        const listingPage = new ListingPage();
        const profilePage = new ProfilePage();
        const homePage = new HomePage();

        // Use event delegation for navigation
        $(document).on('click', '#home', (e) => {
            e.preventDefault();
            console.log('Home button clicked via delegation');
            console.log('Current URL before:', window.location.href);
            history.pushState({}, '', '/');
            console.log('Current URL after:', window.location.href);
            PageLoader.loadContent('Home', () => {
                setTimeout(() => homePage.show(), 100); // Small delay to ensure DOM is ready
            });
        });

        $(document).on('click', '#profile', (e) => {
            e.preventDefault();
            console.log('Profile button clicked via delegation');
            const currentUser = CacheService.GetCurrentUser();
            
            if (!currentUser || !currentUser.id) {
                $('#content').html(`<div id="nouser"><h1>No User Logged In</h1>
                    <script src="https://accounts.google.com/gsi/client" async defer></script>
                    <div id="g_id_onload"
                        data-client_id="763140433455-9tudkmcpnbec0dv4ndej56r1kho6hd3o.apps.googleusercontent.com"
                        data-callback="onGoogleSignIn"
                        data-auto_prompt="false">
                    </div>
                
                    <div class="g_id_signin"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="sign_in_with"
                        data-size="large"
                        data-logo_alignment="left">
                    </div></div>`);
            } else {
                history.pushState({}, '', `/profile/${currentUser.id}`);
                PageLoader.loadContent('My Profile', () => {
                    setTimeout(() => profilePage.show(PageLoader.loadContent, ListingPage.showCreate), 100);
                });
            }
        });

        // Initialize pages without click handlers since we're using delegation
        profilePage.init(PageLoader.loadContent);
        homePage.init(PageLoader.loadContent);

        // Set up Google Sign-in callback
        window.onGoogleSignIn = async function (response) {
            try {
                const credential = response.credential;
                const user = await UserProfileService.verifyGoogleLogin(credential);
                if (user && user.id) {
                    CacheService.set("current_user", user);
                    window.location.href = '/profile/' + user.id;
                } else {
                    alert("Login failed on server.");
                }
            } catch (err) {
                console.error("Google login error:", err);
                alert("Google login failed.");
            }
        };

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        const path = window.location.pathname;
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const listingPage = new ListingPage();
        const profilePage = new ProfilePage();
        const homePage = new HomePage();

        if (path.startsWith('/profile/')) {
            PageLoader.loadContent('My Profile', () => {
                setTimeout(() => profilePage.show(PageLoader.loadContent, ListingPage.showCreate), 100);
            });
        } else if (path === '/create') {
            PageLoader.loadContent('Create Listing', () => ListingPage.showCreate());
        } else if (path.startsWith('/listing/')) {
            PageLoader.loadContent('Listing Details', () => listingPage.show());
        } else {
            PageLoader.loadContent('Home', () => {
                setTimeout(() => homePage.show(), 100);
            });
        }
    }
}