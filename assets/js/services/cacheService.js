class CacheService {
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static get(key) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }

    static remove(key) {
        localStorage.removeItem(key);
    }
}

export { CacheService };