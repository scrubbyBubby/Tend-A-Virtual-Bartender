import storage from '../storage/storage.js';
import loginLogout from '../loginLogout/loginLogout.js';
import axios from "axios";

class UserScores {
    constructor() {
        this.subscriptions = {};
        this.cache = undefined;
    }

    forceUpdate() {
        const scoreResult = this.getAllScores();
        scoreResult.then(userScores => {
            this.setAllScores(userScores);
        })
    }

    async getAllScores(noCache = false) {
        const protocols = {
            fromCache: () => {
                return this.cache;
            },
            fromMemory: async () => {
                const scores = await storage.get({ source: 'local', target: 'drinkScores', defaultValue: [] });
                this.cache = scores;
                return scores;
            }
        };

        const protocol = (noCache || this.cache === undefined) ? "fromMemory" : "fromCache";
        
        return await protocols[protocol]();
    }

    setAllScores(scores, update = true) {
        this.cache = scores;
        
        if (update) {
            const protocols = {
                updateMemory: (scores) => {
                    storage.set({ source: 'local', target: 'drinkScores', value: scores });
                },
                updateDB: (scores) => {
                    axios.post("/update/user", { scores })
                }
            };
    
            const protocol = (loginLogout.loggedIn) ? "updateDB" : "updateMemory";
    
            protocols[protocol](scores);
            this.handleAllSubscriptions();
        }
    }

    async setScore(drinkId, score) {
        const scores = await this.getAllScores();
        const found = scores.some((scoreObj, index) => {
            if (scoreObj.drinkId === drinkId) {
                scores[index].score = score;
                return true;
            }
            return false;
        });
        if (!found) {
            const newScore = {
                drinkId,
                score
            };
            scores.push(newScore);
        }
        this.setAllScores(scores);
    }

    async getScore(drinkId) {
        const scores = await this.getAllScores();
        const score = scores.find(score => score.drinkId === drinkId) || {score: 0};
        return score.score;
    }

    getScoreFromCache(drinkId) {
        const scores = this.cache;
        const score = scores.find(score => score.drinkId === drinkId) || {score: 0};
        return score.score;
    }

    handleSubscriptions(drinkId, score) {
        const subs = this.subscriptions;
        if (subs[drinkId] !== undefined) {
            const callbacks = subs[drinkId];
            callbacks.forEach(cb => {
                cb({drinkId, score});
            })
        }
    }

    async handleAllSubscriptions() {
        const scores = await this.getAllScores();
        const subsForAll = this.subscriptions._all || [];
        subsForAll.forEach(cb => {
            cb({ scores: scores });
        })
    }

    subscribe({ drinkId, callback }) {
        const newSubs = this.subscriptions;
        if (newSubs[drinkId] === undefined) {
            newSubs[drinkId] = [];
        }
        newSubs[drinkId].push(callback);
        this.subscriptions = newSubs;
    }

    subscribeAll({ callback }) {
        const newSubs = this.subscriptions;
        if (newSubs._all === undefined) {
            newSubs._all = [];
        }
        newSubs._all.push(callback);
        this.subscriptions = newSubs;
    }
}

const instance = new UserScores();

export default instance;