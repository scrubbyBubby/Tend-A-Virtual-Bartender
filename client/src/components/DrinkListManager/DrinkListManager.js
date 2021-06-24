import React, { Component } from 'react';
import './DrinkListManager.css';

import DrinkList from '../DrinkList/DrinkList.js';
import Autocomplete from '../Autocomplete/Autocomplete.js';

import drinkLists from '../../services/drinkLists/drinkLists.js';
import utility from '../../services/utility/utility.js';
import cdb from '../../services/cocktailDBAPI/cocktailDBAPI.js';

class DrinkListManager extends Component {
  constructor() {
    super();

    this.state = {
      drinkView: false,
      listNames: [],
      removeTargetListName: undefined,
      listSelectorView: true,
      selectedList: undefined
    };

    this.removeSet = {
      target: "\u2713",
      notTarget: "\u2717"
    };

    this.removeTargetTimeout = undefined;
    this.RTTWait = 3000;
    
    this.handleNewListKeyPress = this.handleNewListKeyPress.bind(this);
    this.handleNewListBlur = this.handleNewListBlur.bind(this);
    this.handleClickListName = this.handleClickListName.bind(this);
    this.handleClickDeleteList = this.handleClickDeleteList.bind(this);
    this.handleClickSwitchLists = this.handleClickSwitchLists.bind(this);
    this.handleClickListSelectorCover = this.handleClickListSelectorCover.bind(this);

    this.mounted = false;
    this.onMountQueue = [];
    this.assureMount = (func) => {
      if (this.mounted) {
        func();
      } else {
        this.onMountQueue.push(func);
      }
    }

    const self = this;
    const listNames = drinkLists.getListArray();
    listNames.then(data => {
      self.assureMount(() => self.setState({ listNames: data }));
    });

    drinkLists.subscribeAll({ 
      async callback({ allLists }) {
        const updateState = async () => {
          const newState = { listNames: await drinkLists.getListArray() };
          if (newState.listNames.indexOf(self.state.selectedList) === -1) {
            newState.selectedList = undefined;
          }
  
          self.setState(newState);
        }

        self.assureMount(updateState);
      }
    });

    utility.EventEmitter.subscribe("new-user-data-loaded", ({ drinkLists }) => {
      const updateListNames = () => {
        const listNames = drinkLists.map(drinkList => drinkList.name);
        self.setState({
          drinkView: false,
          listNames,
          removeTargetListName: undefined,
          listSelectorView: true,
          selectedList: undefined
        });
      };

      self.assureMount(updateListNames);
    });
  }

  componentDidMount() {
    const self = this;

    const headerElement = document.querySelector(".master-header");
    headerElement.addEventListener("click", (e) => {
      self.setState({ drinkView: false });
    });

    this.onMountQueue.forEach(func => func());
    this.mounted = true;
    this.onMountQueue = [];
  }

  constructAutocompleteInfo() {
    const self = this;
    const select = function(listName) {
      return (result) => {
        drinkLists.addItem({ listName, item: result });
      }
    };

    return {
      hide: true,
      hideOnlyWhenEmpty: true,
      debounce: 500,
      inputStyling: {
        fontSize: "24px",
        padding: "5px 10px",
        height: "32px",
        margin: "10px 10px 5px 10px"
      },
      listStyling: {
        width: "calc(100% - 22px)",
        overflowY: "auto",
        border: "1px solid black",
        maxHeight: "400px"
      },
      placeholder: "Add drinks from here",
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
          score: "score",
          "reverse-alphabetical": "reverseName"
        })["alphabetical"];

        const compareProtocols = {
          name: (val1, val2) => utility.alphabetizationCompare(val1.name, val2.name),
          reverseName: (val1, val2) => utility.alphabetizationCompare(val1.name, val2.name, true),
          score: (val1, val2) => {
            const [ score1, score2 ] = [ val1.score, val2.score ];
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
        const inList = drinkLists.checkDrinkInManagerList(result);
        const onList = (inList) ? "onList" : "notOnList";
        const className = `switch-icon-wrapper small-list-card${(inList) ? " green-tint hover-red-tint" : " hover-darken"}`;
        const iconClassName = `space-right`;
        const listAdderItemStates = {
          onList: {
            default: "\u2713",
            hover: "X"
          },
          notOnList: {
            default: "",
            hover: "+"
          }
        };

        return <div className={ className }>
          <div className="flex-grow">
            { result.name }
          </div>
          <div className={ iconClassName }>
            <div className="small-icon no-borders absolute-icon-wrapper">
              <div className="default-icon no-background">
                { listAdderItemStates[onList].default }
              </div>
              <div className="hover-icon no-background">
                { listAdderItemStates[onList].hover }
              </div>
            </div>
          </div>
        </div>
      },
      async select(result) {
        const listName = drinkLists.getManagerList();
        drinkLists.toggleItem({ 
          listName, 
          item: result, 
          removalCheck: (item) => item.id === result.id
        });
      },
      noResults() {
        return <div className="no-results-text small-list-card">No Results Found</div>
      }
    };
  }

  handleNewListKeyPress(e) {
    if (e.key === "Enter") e.target.blur();
  }

  handleNewListBlur(e) {
    const { target } = e;
    if (target.value.trim() !== "") {
      const listName = target.value.trim();
      const initialItemArray = [];
      const createListResult = drinkLists.createList({ listName, initialItemArray });
      createListResult.then(dl => {
        this.setState({
          listNames: Object.keys(dl)
        });
      })
      target.value = "";
    }
  }

  handleClickListName(e, listName) {
    drinkLists.setManagerList(listName);
    this.setState({ selectedList: listName, listSelectorView: false });
  }

  handleClickDeleteList(e, listName, isTarget) {
    e.stopPropagation();
    if (this.removeTargetTimeout !== undefined) {
      clearTimeout(this.removeTargetTimeout);
      this.removeTargetTimeout = undefined;
    }
    if (!isTarget) {
      this.setState({ removeTargetListName: listName });

      const self = this;
      const callback = () => {
        self.setState({ removeTargetListName: undefined });
      };

      this.removeTargetTimeout = setTimeout(callback, this.RTTWait);
    }
    else {
      drinkLists.deleteListByListName(listName);
      const listNameResult = drinkLists.getListArray();
      listNameResult.then(listNames => {
        this.setState({ listNames, removeTargetListName: undefined });
      });
    }
  }

  stopProp(e) {
    e.stopPropagation();
  }

  handleClickSwitchLists(e) {
    this.setState({ listSelectorView: true });
  }

  handleClickListSelectorCover(e) {
    const { selectedList } = this.state;
    if (selectedList !== undefined) {
      this.setState({ listSelectorView: false });
    }
  }

  render() {
    const { 
      handleClickListName, 
      handleClickDeleteList, 
      handleClickSwitchLists,
      handleClickListSelectorCover,
      removeSet, 
      constructAutocompleteInfo, 
      stopProp 
    } = this;
    const { listNames, removeTargetListName, selectedList, listSelectorView } = this.state;

    const noItemsDisplay = <div className="large-list-card no-results-text">
      No Lists exist yet
    </div>

    const listItems = (listNames.length === 0) ? noItemsDisplay :
      listNames.map(listName => {
        const isTarget = (listName === removeTargetListName);
        const removeSetValue = removeSet[(isTarget) ? 'target' : 'notTarget'];
        return <div className="list-card pad-left clickable hover-darken show-on-hover-base"
          key={ listName }
          onClick={ (e) => { handleClickListName(e, listName) } }>
          <div className="flex-grow">
            { listName }
          </div>
          <div onClick={ (e) => { handleClickDeleteList(e, listName, isTarget) } }
            className="space-right show-on-hover-head">
            { removeSetValue }
          </div>
        </div>
      });

    const listSelectorClass = `full-absolute flex-center-center transparent-darken${(listSelectorView) ? '' : ' hidden-no-click'}`;
    return <div className="full-relative">
      <div className="full-absolute two-col">
        <div className="flex-column-center-start">
          <div onClick={ handleClickSwitchLists }
            className="list-header-card m-10 clickable hover-darken">Switch Lists</div>
          <Autocomplete info={ constructAutocompleteInfo() }></Autocomplete>
        </div>
        <DrinkList listName={ selectedList }></DrinkList>
      </div>
      <div onClick={ handleClickListSelectorCover } className={ listSelectorClass }>
        <div onClick={ stopProp } className="w-500 flex-stretch-start flex-column list-w-outer-border">
          <div className="list-header-card">
            Drink Lists
          </div>
          { listItems }
          <div className="list-card flex-center-center">
            <input spellCheck="false" className="no-borders medium-text" onKeyPress={ this.handleNewListKeyPress } onBlur={ this.handleNewListBlur }
              placeholder="+ New List" />
          </div>
        </div>
      </div>
    </div>
  }
}
export default DrinkListManager;
