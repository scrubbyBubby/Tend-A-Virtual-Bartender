import React, { Component } from 'react';
import './DrinkSearch.css';

import Autocomplete from '../Autocomplete/Autocomplete.js';
import DrinkScore from '../DrinkScore/DrinkScore.js';
import DrinkView from '../DrinkView/DrinkView.js';

import cdb from '../../services/cocktailDBAPI/cocktailDBAPI.js';
import utility from '../../services/utility/utility.js';
import userScores from '../../services/userScores/userScores.js';
import drinkLists from '../../services/drinkLists/drinkLists.js';
import liquorShelf from '../../services/liquorShelf/liquorShelf.js';

class DrinkSearch extends Component {
  constructor() {
    super();
    this.state = {
      listAdder: false,
      listAdderItem: {},
      listAdderStates: {},
      drinkView: false,
      drinkViewInfo: {
        id: 0
      },
      search: "byName",
      sort: "alphabetical",
      autocompleteInfo: this.constructAutocomplete({ search: 'byName', sort: 'alphabetical' })
    };

    this.setNewSearch = this.setNewSearch.bind(this);
    this.setNewSort = this.setNewSort.bind(this);
    this.handleListAdderClick = this.handleListAdderClick.bind(this);
    this.handleListAdderClose = this.handleListAdderClose.bind(this);
    this.handleNewListKeyPress = this.handleNewListKeyPress.bind(this);
    this.handleNewListBlur = this.handleNewListBlur.bind(this);
    this.handleSortClick = this.handleSortClick.bind(this);
  }

  componentDidMount() {
    const self = this;

    const headerElement = document.querySelector(".master-header");
    headerElement.addEventListener("click", (e) => {
      self.setState({ drinkView: false });
    })
  }

  constructAutocomplete({search, sort}) {
    const self = this;

    const autocompleteInfo = {
      hide: false,
      debounce: 500,
      inputStyling: {
        fontSize: "32px",
        padding: "5px 10px",
        height: "42px",
        margin: "10px 10px 20px 10px"
      },
      listStyling: {
        overflowY: "auto",
        border: "1px solid black",
        position: "static"
      },
      placeholder: "",
      async lookup(data, watchRef) {
        const text = data.target.innerText.trim();
        if (text.length === 0) return [];
        
        let focus = (text.length === 1) ? 'byFirstLetter' : 'byName';
    
        const results = await cdb.constructSearch({
          type: "cocktail",
          focus,
          text
        });
        
        return results;
      },
      sort(results, watchRef) {
        const sortFocus = ({
          alphabetical: "name",
          rating: "score",
          "reverse-alphabetical": "reverseName"
        })[watchRef.sort];

        const compareProtocols = {
          name: (val1, val2) => utility.alphabetizationCompare(val1.name, val2.name),
          reverseName: (val1, val2) => utility.alphabetizationCompare(val1.name, val2.name, true),
          score: (val1, val2) => {
            const [ score1, score2 ] = [ val1.score || 0, val2.score || 0 ];
            return score1 > score2;
          }
        }

        const sortedResults = utility.sortArray({ 
          arr: results,
          compare: compareProtocols[sortFocus]
        });

        return sortedResults;
      },
      render(result) {
        const checkElement = <span className="medium-text small-space-left">{ " \u2713" }</span>;
        const newIngredients = result.simpleIngredients.map(
          ingredientName => 
            `${ingredientName}${liquorShelf.checkLiquorRef(ingredientName) ? 
              " \u2713" : ""}`
        );
        return <div className="drink-item hover-darken clickable">
          <div className="drink-item-name">
            { result.name }
          </div>
          <div onClick={ (e) => { self.handleListAdderClick(e, result) } } className="drink-item-list-adder">
            <span className="large-text oval-button hover-button">+ Add to a list</span>
          </div>
          <img className="drink-item-image" alt={ result.name } src={ result.thumb }></img>
          <div className="drink-item-ingredients">
            <div className="fancy-tag">Needs:</div>
            <div className="drink-item-ingredient-list">
              { newIngredients.map((name, index) => {
                const lastItem = newIngredients.length === index + 1;
                const text = (lastItem) ? name : `${name}, `;
                return <span className="space-right">{ text }</span>
              }) }
            </div>
          </div>
          <div className="drink-item-glass">
            <div className="fancy-tag space-right">Glass:</div>
            <div className="flex-center-start">
              <div className="medium-text space-left">{ result.glass }</div>
              { liquorShelf.checkGlassRef(result.glass) ? checkElement : "" }
            </div>
          </div>
          <div onClick={ self.stopProp } className="notes-and-score">
            <div style={ { display: "none" } } className="flex-left-center">
              <div className="fancy-tag">Notes:</div>
              <div className="notes-icon">i</div>
            </div>
            <div className="flex-left-center no-click">
              <div className="fancy-tag">Score:</div>
              <DrinkScore 
                size="100"
                value={ userScores.getScoreFromCache(result.id) || 0 }
                drinkId={ result.id }
              ></DrinkScore>
            </div>
          </div>
        </div>
      },
      async select(result) {
        const data = await cdb.constructSearch({
          type: "cocktail",
          focus: "byId",
          text: result.id
        });
        self.setState({drinkView: true, drinkViewInfo: data[0]});
      },
      noResults() {
        return <div className="no-results-display">No Results Found</div>
      }
    };

    return autocompleteInfo;
  }

  buildNewAutocomplete({search, sort}) {
    search = search || this.state.search;
    sort = sort || this.state.sort;
    const autocompleteInfo = this.constructAutocomplete({search, sort});
    this.setState({ autocompleteInfo });
    return autocompleteInfo;
  }

  setNewSearch(e) {
    this.setState({search: e.target.value});
    this.buildNewAutocomplete({  search: e.target.value });
  }

  setNewSort(e) {
    this.setState({sort: e.target.value});
    this.buildNewAutocomplete({ sort: e.target.value });
  }

  handleSortClick(newSort) {
    this.buildNewAutocomplete({ sort: newSort });
    this.setState({ sort: newSort });
  }

  handleListAdderClick(e, result) {
    e.stopPropagation();
    const listAdderResult = drinkLists.getStatesByItem({ retrievalCheck: (item) => {
        return item.id === result.id;
      }
    });

    listAdderResult.then(listAdderStates => {
      this.setState({ listAdder: true, listAdderItem: result, listAdderStates });
      e.stopPropagation();
    })
  }

  handleListAdderClose(e) {
    this.setState({listAdder: false, listAdderItem: {}});
  }

  getListAdderMenuStyle() {
    const style = {};
    if (!this.state.listAdder) style["display"] = "none";
    return style;
  }

  handleAddToList(e, listName) {
    const { listAdderItem, listAdderStates } = this.state;
    const stateObj = Object.assign({}, listAdderStates);
    stateObj[listName] = !stateObj[listName];
    drinkLists.setStatesByItem({ 
      setCheck(item) {
        return item.id === listAdderItem.id;
      },
      setItem: listAdderItem,
      stateObj
    });
    this.setState({ listAdderStates: stateObj });
  }

  stopProp(e) {
    e.stopPropagation();
    return e;
  }

  handleNewListKeyPress(e) {
    if (e.key === "Enter") e.target.blur();
  }

  async handleNewListBlur(e) {
    const { target } = e;
    if (target.value.trim() !== "") {
      const listName = target.value.trim();
      const initialItemArray = [
        Object.assign({}, this.state.listAdderItem)
      ];
      await drinkLists.createList({ listName, initialItemArray });
      const itemId = this.state.listAdderItem.id;
      const listAdderStates = await drinkLists.getStatesByItem({ 
        retrievalCheck(item) {
          return item.id === itemId;
        }
      });
      this.setState({ listAdderStates });
      target.value = "";
    }
  }

  render() {
    const {
      autocompleteInfo,
      listAdderItem,
      listAdderStates,
      sort,
      drinkView,
      drinkViewInfo
    } = this.state;

    const watchList = [
      {
        id: "drink-sort-by-a-to-z",
        alias: "sort",
        initial: this.state.sort,
        onUpdate: ["sort"],
        handlerType: "click",
        handler: (e) => "alphabetical"
      },{
        id: "drink-sort-by-z-to-a",
        alias: "sort",
        initial: this.state.sort,
        onUpdate: ["sort"],
        handlerType: "click",
        handler: (e) => "reverse-alphabetical"
      },{
        id: "drink-sort-by-rating",
        alias: "sort",
        initial: this.state.sort,
        onUpdate: ["sort"],
        handlerType: "click",
        handler: (e) => "rating"
      }
    ];

    const drinkViewClass = `full-fixed flex-center-center transparent-darken ${(drinkView) ? '':'hidden-no-click'}`;

    const listAdderMenuStyle = this.getListAdderMenuStyle();

    const dl = drinkLists.getListsFromCache() || [];
    const arr = dl.map(drink => drink.name);
    const listNames = utility.sortArray({ arr, compare: utility.alphabetizationCompare });
    const noItemsDisplay = <div className="large-list-card no-results-text border-bottom-top">
      No Lists exist yet
    </div>;

    const listAdderItems = (listNames.length === 0) ? noItemsDisplay : listNames.map((name, index) => {
      const className = `list-adder-item flex-center-center list-card medium-text no-side-borders switch-icon-wrapper clickable hover-darken ${(index === 0) ? "with-top":""}`;
      const onList = (listAdderStates[name]) ? "onList" : "notOnList";
      return <div className={ className } key={ name } onClick={(e) => {this.handleAddToList(e, name)}}>
        <div className="flex-center-center">
          { name }
        </div>
        <div className="small-icon absolute-icon-wrapper">
          <div className="default-icon">
            { listAdderItemStates[onList].default }
          </div>
          <div className="hover-icon">
            { listAdderItemStates[onList].hover }
          </div>
        </div>
      </div>
    });

    const listAdderItemStates = {
      onList: {
        default: "\u2713",
        hover: "\u2713"
      },
      notOnList: {
        default: "",
        hover: ""
      }
    };

    const [ sortAZClassName, sortZAClassName, sortRatingClassName ] =
      ['alphabetical', 'reverse-alphabetical', 'rating' ].map(
        (sortName) =>  `oval-button clickable ${sort === sortName ? 'darken' : ''}`
      );

    const drinkViewStyle = {
      height: "700px",
      maxHeight: "700px",
      width: "700px",
      maxWidth: "700px",
      position: "relative"
    };

    const drinkViewElement = <div style={ drinkViewStyle} onClick={ (e) => e.stopPropagation() }>
        <div onClick={ () => {this.setState({drinkView: false})} } className="absolute-top-right close-button clickable"></div>
        { (drinkView) ? <DrinkView drinkInfo={ drinkViewInfo }></DrinkView> : "" }
      </div>

    return <div className="drink-search-wrapper">
        <div className="search-header">
          <div className="search-tag">Search for a drink</div>
          <div className="large-space-left search-tag">Sort by</div>
          <div onClick={ (e) => { this.handleSortClick('alphabetical') } } 
            className={ sortAZClassName } id="drink-sort-by-a-to-z">
            A to Z
          </div>
          <div onClick={ (e) => { this.handleSortClick('reverse-alphabetical') } } 
            className={ sortZAClassName } id="drink-sort-by-z-to-a">
            Z to A
          </div>
          <div onClick={ (e) => { this.handleSortClick('rating') } }
            className={ sortRatingClassName } id="drink-sort-by-rating">
            Rating
          </div>
        </div>
        <Autocomplete info={ autocompleteInfo } watchList={ watchList }></Autocomplete>
        <div className={ drinkViewClass } onClick={ (e) => {e.stopPropagation(); this.setState({ drinkView: false })} }>
          { drinkViewElement }
        </div>
        <div onClick={ this.handleListAdderClose } 
          style={ listAdderMenuStyle }
          className="full-fixed transparent-darken flex-center-center">
          <div onClick={ this.stopProp } className="card-list wh-600 relative">
            <div onClick={ this.handleListAdderClose } className="absolute-top-right close-button clickable"></div>
            <div className="list-header-card no-borders">Lists Containing {listAdderItem.name}</div>
            { listAdderItems }
            <div className="list-card no-side-borders medium-text clickable flex-center-center">
              <input spellcheck="false" className="no-borders medium-text" onKeyPress={ this.handleNewListKeyPress } onBlur={ this.handleNewListBlur }
                placeholder="+ New List" />
            </div>
          </div>
        </div>
      </div>
  }
}

export default DrinkSearch;
