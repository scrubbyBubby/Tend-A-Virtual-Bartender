const uniqueIds = [];

class Utility {
    constructor() {
        this.EventEmitter = {
            events: {},
            dispatch: function (event, data) {
                if (!this.events[event]) return;
                this.events[event].forEach(callback => callback(data));
            },
            subscribe: function (event, callback) {
                if (!this.events[event]) this.events[event] = [];
                this.events[event].push(callback);
            }
        }
    }

    debounce(func, debounceTime = 1000) {
        let timeoutId;
        return (...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(null, args);
            }, debounceTime)
        };
    }

    getUniqueId() {
        const generateId = (length) => {
            const characters = "abcdefghijklmnopqrstuvwxyz-";

            const results = [];
            for (var i = 0; i < length; i++) {
                const index = Math.floor(Math.random() * characters.length);
                results.push(characters[index]);
            }

            const id = results.join("");
            return id;
        }

        while(true) {
            const id = generateId(10);
            if (uniqueIds.indexOf(id) === -1) {
                uniqueIds.push(id);
                return id;
            }
        }
    }

    arrayCheck(arr, callback) {
       for (var i = 0; i < arr.length; i++) {
           const result = callback(arr[i], i);
           if (result === true || result === false) {
               return result;
           }
       }
    }

    sortArray({ arr, compare }) {
        const results = [];

        arr.forEach(item => {
            const found = results.some((result, index) => {
                const before = compare(item, result);
                if (before) {
                    results.splice(index, 0, item);
                }
                return before;
            });
            if (!found) {
                results.push(item);
            }
        });

        return results;
    }

    checkObjectsEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let key of keys1) {
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }

        return true;
    }

    alphabetizationCompare(val1, val2, ztoa = false) {
        const arrayCheck = (arr, callback) => {
            for (var i = 0; i < arr.length; i++) {
                const result = callback(arr[i], i);
                if (result === true || result === false) {
                    return result;
                }
            }
        };

        const alpha = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
        const arr1 = val1.split("");
        const arr2 = val2.split("");

        const result = arrayCheck(arr1, 
            (char1, index) => {
                const char2 = arr2[index];

                const charVal1 = alpha.indexOf(char1);
                const charVal2 = alpha.indexOf(char2);

                if (charVal1 < charVal2) {
                    return !ztoa;
                } else if (charVal1 > charVal2) {
                    return ztoa;
                }
            }
        );

        if (result === undefined) {
            return (arr1.length < arr2.length);
        } else {
            return result;
        }
    }

    alphabetizeObjectArray(arr, byProp) {
        const compare = (val1, val2) => {
            return this.alphabetizationCompare(val1[byProp], val2[byProp]);
        }
        return this.sortArray({ arr, byProp, compare });
    }
}

const utility = new Utility();

export default utility;