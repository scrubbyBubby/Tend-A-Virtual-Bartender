import axios from "axios";

import storage from '../storage/storage.js';
import utility from '../utility/utility.js';
import loginLogout from '../loginLogout/loginLogout.js';

const storagePartial = {
    source: "local",
    target: "drinkLists"
}

class drinkLists {
    constructor() {
        this.defaultDrinkLists = [];
        this.subscriptions = {};

        this.cache = undefined;

        this.managerList = undefined;
    }

    forceUpdate() {
        const drinkListResult = this.getAllLists();
        drinkListResult.then(drinkLists => {
            this.setAllLists(drinkLists);
        })
    }

    getManagerList() {
        return this.managerList;
    }

    setManagerList(listName) {
        this.managerList = listName;
    }

    getListsFromCache() {
        return this.cache;
    }

    async getAllLists(noCache = false) {
        const protocols = {
            fromMemory: async () => {
                const drinkLists = await storage.get({
                    source: "local",
                    target: "drinkLists",
                    defaultValue: []
                });
                this.cache = drinkLists;
                return drinkLists;
            },
            fromCache: () => {
                return this.cache;
            }
        };

        const protocol = (noCache || this.cache === undefined) ? "fromMemory" : "fromCache";

        return protocols[protocol]();
    }

    setAllLists(newLists, update = true) {
        this.cache = newLists;

        if (update) {
            const protocols = {
                updateMemory: (newLists) => {
                    storage.set({
                        ...storagePartial,
                        value: newLists
                    });
                },
                updateDB: (newLists) => {
                    axios.post("/update/user", {drinkLists: newLists});
                }
            };
    
            const protocol = (loginLogout.loggedIn) ? "updateDB" : "updateMemory";
            protocols[protocol](newLists);
        }
        
        this.handleSubscriptions(newLists);
    }

    async getListArray() {
        const drinkLists = await this.getAllLists();
        return drinkLists.map(drinkList => drinkList.name);
    }

    async getList(listName) {
        const drinkLists = await this.getAllLists();
        const drinkList = drinkLists.find(list => list.name === listName) || {items: []};
        return drinkList.items;
    }

    async setList(listName, value) {
        const drinkLists = await this.getAllLists();
        const drinkList = {
            name: listName,
            items: value
        };
        drinkLists.push(drinkList);
        this.setAllLists(drinkLists);
    }

    async addItem({ listName, item }) {
        const drinkLists = await this.getAllLists();
        drinkLists.some((drinkList, index) => {
            if (drinkList.name === listName) {
                drinkLists[index].items.push(item);
                return true;
            }
        });
        this.setAllLists(drinkLists);
    }

    async removeItem({ listName, item }) {
        const drinkLists = await this.getAllLists();
        const drinkList = drinkLists[listName];
        drinkList.items.forEach((referenceItem, index) => {
            if (utility.checkObjectsEqual(item, referenceItem)) {
                drinkList.items.splice(index, 1);
                return true;
            }
        });
        this.setAllLists(drinkLists);
    }

    toggleItem({ listName, item, removalCheck }) {
        const removeResult = this.removeItemsByCheck({ listName, removalCheck });
        removeResult.then(result => {
            if (!result) {
                this.addItem({ listName, item });
            }
        })
    }

    async removeItemsByCheck({ listName, removalCheck }) {
        const drinkLists = await this.getAllLists();
        let found = false;
        drinkLists.some((drinkList, index) => {
            if (drinkList.name === listName) {
                const initialLength = drinkList.items.length;
                drinkList.items = drinkList.items.filter((item) => !removalCheck(item));
                const finalLength = drinkList.items.length;
                if (finalLength < initialLength) found = true;
                drinkLists[index] = drinkList;
                return true;
            }
        });
        
        this.setAllLists(drinkLists);
        return found;
    }

    handleSubscriptions(newLists) {
        const subs = this.subscriptions;
        Object.keys(subs).filter(sub => sub !== undefined).forEach(listName => {
            const subList = subs[listName];
            if (listName === '_all') {
                subList.forEach( cb => {
                    cb({ allLists: newLists })
                })
            } else {
                const listInfo = newLists[listName];
                subList.forEach(cb => {
                    cb({ listName, listInfo })
                })
            }
        })
    }

    async getStatesByItem({ retrievalCheck }) {
        const drinkLists = await this.getAllLists();

        const states = drinkLists.reduce((stateObj, drinkList) => {
            const listName = drinkList.name;
            const result = drinkList.items.some(item => retrievalCheck(item));
            stateObj[listName] = result;
            return stateObj;
        }, {});

        return states;
    }

    setStatesByItem({ setCheck, setItem, stateObj }) {
        const drinkListsPromise = this.getAllLists();
        drinkListsPromise.then(drinkLists => {
            drinkLists.forEach(drinkList => {
                const listName = drinkList.name;
                const newState = stateObj[listName];
                const inList = drinkList.items.some((item, index) => {
                    const result = setCheck(item);
                    if (result && !newState) {
                        drinkList.items.splice(index, 1);
                    }
                    return result;
                });
                if (!inList && newState) {
                    drinkList.items.push(setItem);
                }
            })
            this.setAllLists(drinkLists);
        })
    }
    
    async createList({ listName, initialItemArray }) {
        const drinkLists = await this.getAllLists();
        const alreadyExists = drinkLists.some(drinkList => drinkList.name === listName);
        if (!alreadyExists) {
            const newDrinkList = {
                name: listName,
                items: initialItemArray
            };
            drinkLists.push(newDrinkList);
            this.setAllLists(drinkLists);
        }
        return drinkLists;
    }

    deleteListByListName(listName) {
        const drinkListsResult = this.getAllLists();
        drinkListsResult.then(drinkLists => {
                drinkLists = drinkLists.filter(drinkList => drinkList.name !== listName);
                this.setAllLists(drinkLists);
            }
        )
    }

    subscribe({ listName, callback }) {
        if (listName === "_all") return;
        const subs = this.subscriptions;
        if (subs[listName] === undefined) {
            subs[listName] = [];
        }
        subs[listName].push(callback);
    }

    subscribeAll({ callback }) {
        const subs = this.subscriptions;
        if (subs._all === undefined) {
            subs._all = [];
        }
        subs._all.push(callback);
    }

    checkDrinkInManagerList(item) {
        const comparison = (result) => item.id === result.id;
        const { managerList } = this;
        const drinkLists = this.cache;
        const drinkList = drinkLists.find(dl => dl.name === managerList);
        if (drinkList) {
            const inList = drinkList.items.some(item => comparison(item));
            return inList;
        } else {
            return false;
        }
    }
}

const instance = new drinkLists();

export default instance;