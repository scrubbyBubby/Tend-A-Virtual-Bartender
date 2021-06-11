import storage from '../storage/storage.js';
import utility from '../utility/utility.js';
import cdb from '../cocktailDBAPI/cocktailDBAPI.js';
import axios from 'axios';
import loginLogout from '../loginLogout/loginLogout.js';

const ingredientStoragePartial = {
    source: "local",
    target: "liquorShelf"
};

const glassStoragePartial = {
    source: "local",
    target: "glassShelf"
};

class liquorShelf {
    constructor() {
        const self = this;

        self.liquorCache = this.getLiquorRef();
        self.liquorCache.then(data => {
            self.liquorCache = data;
        });

        self.glassCache = this.getGlassRef();
        self.glassCache.then(data => {
            self.glassCache = data;
        });
        
        this.ingredientList = [];
        this.subscriptions = {};
    }

    forceUpdate() {
        const liquorRefResult = this.getLiquorRef();
        liquorRefResult.then(liquorRef => {
            this.setLiquorRef(liquorRef);
        });

        const glassRefResult = this.getGlassRef();
        glassRefResult.then(glassRef => {
            this.setGlassRef(glassRef);
        });
    }

    async getLiquorRef(noCache = false) {
        const protocols = {
            fromCache: () => {
                return this.liquorCache;
            },
            fromMemory: async () => {
                const liquorRef = await storage.get({
                    ...ingredientStoragePartial,
                    defaultValue: []
                });
                this.liquorCache = liquorRef;
                return liquorRef;
            }
        };

        const protocol = (noCache || this.liquorCache === undefined) ? "fromMemory" : "fromCache";
        
        return await protocols[protocol]();
    }

    setLiquorRef(liquorRef, update = true) {
        this.liquorCache = liquorRef;
        
        if (update) {
            const protocols = {
                updateMemory: (liquorRef) => {
                    storage.set({ ...ingredientStoragePartial, value: liquorRef });
                },
                updateDB: (liquorRef) => {
                    const liquorShelf = this.assembleLiquorShelf({ liquorRef });
                    axios.post("/update/user", { liquorShelf });
                }
            };
    
            const protocol = (loginLogout.loggedIn) ? "updateDB" : "updateMemory";
    
            protocols[protocol](liquorRef);
        }

        this.handleSubscriptions();
        return this.glassCache;
    }

    async getGlassRef(noCache = false) {
        const protocols = {
            fromCache: () => {
                return this.glassCache;
            },
            fromMemory: async () => {
                const glassRef = await storage.get({
                    ...glassStoragePartial,
                    defaultValue: []
                });
                this.glassCache = glassRef;
                return glassRef;
            }
        };

        const protocol = (noCache || this.glassCache === undefined) ? "fromMemory" : "fromCache";
        
        return await protocols[protocol]();
    }

    setGlassRef(glassRef, update = true) {
        this.glassCache = glassRef;
        
        if (update) {
            const protocols = {
                updateMemory: (glassRef) => {
                    storage.set({ ...ingredientStoragePartial, value: glassRef });
                },
                updateDB: (glassRef) => {
                    const liquorShelf = this.assembleLiquorShelf({ glassRef });
                    axios.post("/update/user", { liquorShelf })
                }
            };
    
            const protocol = (loginLogout.loggedIn) ? "updateDB" : "updateMemory";
    
            protocols[protocol](glassRef);
        }

        this.handleSubscriptions();
        return this.glassCache;
    }

    assembleLiquorShelf(baseLiquorShelf = {}) {
        const liquorRef = baseLiquorShelf.liquorRef || {};
        const glassRef = baseLiquorShelf.glassRef || {};
        return [
            {
                name: "liquorRef",
                ref: liquorRef
            },{
                name: "glassRef",
                ref: glassRef
            }
        ];
    }

    parseLiquorShelf(rawLiquorShelf) {
        const liquorShelf = rawLiquorShelf.reduce((shelfObj, { name, ref }) => {
            shelfObj[name] = ref || {};
            return shelfObj;
        }, {
            glassRef: {},
            liquorRef: {}
        });
        return liquorShelf;
    }

    processLiquorShelf(rawLiquorShelf, update = true) {
        const { liquorRef, glassRef } = this.parseLiquorShelf(rawLiquorShelf);
        if (liquorRef) this.setLiquorRef(liquorRef, update);
        if (glassRef) this.setGlassRef(glassRef, update);
    }

    toggleLiquorState(liquorName) {
        const newRefs = this.liquorCache;
        const prevState = newRefs[liquorName];
        const newState = (prevState) ? false : true;
        newRefs[liquorName] = newState;
        this.setLiquorRef(newRefs);
        this.handleSubscriptions({ 
            targetCheck: (targetLiquorName) => targetLiquorName === liquorName
        });
        return newState;
    }

    toggleGlassState(glassName) {
        const newRefs = this.glassCache;
        const prevState = newRefs[glassName];
        const newState = (prevState) ? false : true;
        newRefs[glassName] = newState;
        this.setGlassRef(newRefs);
        this.handleSubscriptions({
            targetCheck: (targetGlassName) => targetGlassName === glassName
        });
        return newState;
    }

    async getIngredientList() {
        const result = await cdb.constructSearch({
            type: "list",
            focus: "ingredients",
            text: ""
        });

        const ingredientList = utility.sortArray({
            arr: result,
            compare: utility.alphabetizationCompare
        });

        return ingredientList;
    }

    async getGlassList() {
        const result = await cdb.constructSearch({
            type: "list",
            focus: "glasses",
            text: ""
        });

        const glassList = utility.sortArray({
            arr: result,
            compare: utility.alphabetizationCompare
        });
        
        return glassList;
    }

    checkLiquorRef(liquorName) {
        // This portion capitalizes the first letter of the liquorName if it isn't already
        // It's really just a patch because all of the ingredients in the CocktailDB are given with the first letter capitalized
        // But some in the recipe info are not capitalized, which makes cross checking the two difficult
        // So this, but it's only really useful when checking the stored value of a liquorName in the liquorRef
        if (liquorName[0].toLowerCase() === liquorName[0]) {
            const arr = liquorName.split("");
            arr[0] = arr[0].toUpperCase();
            liquorName = arr.join("");
        }
        return this.liquorCache[liquorName] || false;
    }

    checkGlassRef(glassName) {
        return this.glassCache[glassName] || false;
    }

    subscribe({ liquorName, callback }) {
        const { subscriptions: subs } = this;
        if (subs[liquorName] === undefined) subs[liquorName] = [];
        subs[liquorName].push(callback);
    }

    handleSubscriptions(subObj) {
        let { targetCheck } = subObj || {};
        if (!targetCheck) targetCheck = () => true;
        const { subscriptions: subs, liquorRef } = this;
        const subLiquorNames = Object.keys(subs);
        subLiquorNames.forEach(liquorName => {
            if (targetCheck(liquorName)) {
                const cbList = subs[liquorName];
                cbList.forEach(cb => {
                    cb({ newState: liquorRef[liquorName] });
                });
            }
        });
    }
}

const instance = new liquorShelf();

export default instance;