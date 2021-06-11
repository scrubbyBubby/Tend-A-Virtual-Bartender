import userScores from '../userScores/userScores.js';

class CDB {
    constructor() {
        this.test = "Not Tested";
    }

    async constructSearch({type, focus, text = ''}) {
        // each searchArray item has a .type, .focus, and .text property
        // together these properties construct a search condition
        const ref = {
            cocktail: {
                byName: `search.php?s=`,
                byFirstLetter: `search.php?f=`,
                byId: `lookup.php?i=`,
                random: `random.php`,
                byIngredient: `filter.php?i=`
            },
            ingredient: {
                byName: `search.php?i=`,
                byId: `lookup.php?iid=`
            },
            filter: {
                byAlcoholic: `filter.php?a=`,
                byCategory: `filter.php?c=`,
                byGlass: 'filter.php?g='
            },
            list: {
                categories: `list.php?c=list`,
                glasses: 'list.php?g=list',
                ingredients: 'list.php?i=list',
                alcoholicFilters: 'list.php?a=list'
            }
        };


        const processProtocols = {
            cocktail: async (result) => {
                result.drinks = result.drinks || [];
                const drinks = await Promise.all(result.drinks.map(drink => {
                    return async function(drink) {
                        const { strDrinkThumb: thumb, strDrink: name, strGlass: glass, idDrink: id, idDrink: key } = drink;
    
                        const score = await userScores.getScore(id) || 0;
                        const simpleIngredients = [];
                        const ingredients = [];
                        let c = 1;
                        while (true) {
                            const ingredient = drink[`strIngredient${c}`];
                            const measure = drink[`strMeasure${c}`] || '';
                            if (ingredient) {
                                simpleIngredients.push(ingredient.trim());
                                ingredients.push(`${measure} ${ingredient}`.trim());
                                c++;
                            } else {
                                break;
                            }
                        }
        
                        let recipe = (drink.strInstructions || "").split(". ");
                        recipe = recipe.filter(item => item.trim() !== '')
                            .map(item => {
                                const i = item.trim();
                                return `${i}${(i[i.length - 1] === "." ? '':'.')}`;
                            });
        
                        return {
                            thumb,
                            id,
                            key,
                            score,
                            name,
                            glass,
                            simpleIngredients,
                            ingredients,
                            recipe
                        }
                    }(drink);
                }));

                return drinks;
            },
            ingredient: async (result) => {
                result.ingredients = result.ingredients || [];
                const ingredients = result.ingredients.map(ingredient => {
                    const { strIngredient: name, idIngredient: id, strDescription: description } = ingredient;
                    return { name, id, description };
                });

                return ingredients;
            },
            filter: async (result) => {
                result.drinks = result.drinks || [];
                const drinks = result.drinks.map(drink => {
                    const { idDrink: id, strDrink: name } = drink;
                    return { id, name };
                });
                return drinks;
            },
            list: async (result) => {
                const listRef = {
                    categories: "Category",
                    glasses: "Glass",
                    ingredients: "Ingredient1",
                    alcoholicFilters: "Alcoholic"
                };

                result.drinks = result.drinks || [];
                const categories = result.drinks.map(drink => drink[`str${listRef[focus]}`]);
                return categories;
            }
        };

        const base = 'https://www.thecocktaildb.com/api/json/v1/1/';

        const tail = `${ref[type][focus]}${text}`;

        const result = await fetch(`${base}${tail}`)
            .then(response => {
                if (response.ok) {
                    return response.body;
                } else {
                    throw new Error('NETWORK RESPONSE NOT OK');
                }
            })
            .then((rb) => {
                const reader = rb.getReader();
                return new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then( ({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                controller.enqueue(value);
                                push();
                            })
                        }

                        push();
                    }
                })
            })
            .then(stream => {
                return new Response(stream, { headers: { "Content-Type": "text/html" } }).json();
            })
            .then(processProtocols[type])
            .then(result => result)
        return result;
    }
}

const cdb = new CDB();

export default cdb;