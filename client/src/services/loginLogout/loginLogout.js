import utility from "../utility/utility.js";
import axios from "axios";
import userScores from '../userScores/userScores.js';
import drinkLists from '../drinkLists/drinkLists.js';
import liquorShelf from '../liquorShelf/liquorShelf.js';

const dbBaseURI = "https://fierce-bastion-27540.herokuapp.com";

class loginLogout {
    constructor() {
        this.loggedIn = false;
        this.user = {};
    }

    checkLoggedIn() {
        return this.loggedIn;
    }

    async loadUserData(user, newUser) {
        this.user = user;
        if (!newUser) {
            userScores.setAllScores(user.scores, false);
            drinkLists.setAllLists(user.drinkLists, false);
            liquorShelf.processLiquorShelf(user.liquorShelf, false);
            utility.EventEmitter.dispatch("new-user-data-loaded", {
                drinkLists: user.drinkLists,
                userScores: user.scores,
                liquorShelf: user.liquorShelf
            });
        } else {
            axios.post(`${dbBaseURI}/update/user`, { 
                scores: await userScores.getAllScores(),
                drinkLists: await drinkLists.getAllLists(),
                liquorShelf: liquorShelf.assembleLiquorShelf()
            });
        }
    }

    async unloadUserData() {
        this.user = {};

        const userScoreResult = userScores.getAllScores(true);
        const drinkListsResult = drinkLists.getAllLists(true);
        const glassRefResult = liquorShelf.getGlassRef(true);
        const liquorRefResult = liquorShelf.getLiquorRef(true);

        await Promise.all([userScoreResult, drinkListsResult, glassRefResult, liquorRefResult])
            .then(([us, dl, gr, lr]) => {
                utility.EventEmitter.dispatch("new-user-data-loaded", {
                    drinkLists: dl,
                    userScores: us,
                    liquorShelf: [
                        {
                            name: 'glassRef',
                            ref: gr
                        },{
                            name: 'liquorRef',
                            ref: lr
                        }
                    ]
                });
            });
    }

    async login(data, onSuccess, onFail) {
        console.log(`Beginning login within service`);
        const res = await axios.post(`${dbBaseURI}/api/auth/register_login`, data);
        const success = res.status === 200 && res.data.user !== undefined;
        if (success) {
            const { newUser } = res.data;
            utility.EventEmitter.dispatch("logged-in", { state: true, newUser });
            const user = res.data.user;
            this.loggedIn = true;
            await this.loadUserData(user, newUser);
            if (onSuccess) onSuccess(res);
        } else {
            if (onFail) onFail(res);
        }
    }

    async checkSession(data, onSuccess, onFail) {
        const res = await axios.post(`${dbBaseURI}/api/auth/checksession`, data);
        const success = res.status === 200 && res.data.user !== undefined;
        if (success) {
            const { newUser } = res.data;
            utility.EventEmitter.dispatch("logged-in", { state: true, newUser });
            const user = res.data.user;
            this.loggedIn = true;
            await this.loadUserData(user, newUser);
            if (onSuccess) onSuccess(res);
        } else {
            if (onFail) onFail(res);
        }
    }

    async logout(data, onSuccess, onFail) {
        this.loggedIn = false;
        utility.EventEmitter.dispatch("logged-in", { state: false });
        const res = await axios.post(`${dbBaseURI}/api/auth/logout`, data);
        const success = res.status === 200;
        if (success) {
            await this.unloadUserData();
            if (onSuccess) onSuccess(res);
        } else {
            if (onFail) onFail(res);
        }
    }
}

const instance = new loginLogout();
export default instance;