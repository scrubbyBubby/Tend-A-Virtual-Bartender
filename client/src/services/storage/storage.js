class Storage {
    constructor() {
        this.local = window.localStorage;
        this.session = window.sessionStorage;

        this.cache = {
            local: {},
            session: {}
        };
    }

    checkSource(source) {
        return ['local', 'session'].indexOf(source) !== -1;
    }

    get({ source, target, defaultValue }) {
        if (this.checkSource(source)) {
            const cache = this.cache[source][target];
            if (cache === undefined) {
                let storedString = this[source].getItem(target);
                if (typeof storedString !== 'string') {storedString = ''};
                const convertedString = (storedString !== '') ? JSON.parse(storedString) : defaultValue;
                this.cache[source][target] = convertedString;
                return convertedString;
            } else {
                return cache;
            }

        } else {
            throw new Error(`Storage retrieval sources must be "local" or "session", not "${source}".`);
        }
    }

    set({ source, target, value }) {
        if (this.checkSource(source)) {
            this[source].setItem(target, JSON.stringify(value));
            this.cache[source][target] = value;
        } else {
            throw new Error(`Storage setting sources must be "local" or "session", not "${source}".`);
        }
    }

    remove({ source, target }) {
        if (this.checkSource(source)) {
            this[source].removeItem(target);
            delete this.cache[source][target];
        } else {
            throw new Error(`Storage removal sources must be "local" or "session", not "${source}".`);
        }
    }
}

const instance = new Storage();

export default instance;