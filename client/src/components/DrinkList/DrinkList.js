import React, { Component } from 'react';
import './DrinkList.css';

import DrinkScore from '../DrinkScore/DrinkScore.js';
import DrinkView from '../DrinkView/DrinkView.js';

import drinkLists from '../../services/drinkLists/drinkLists.js';
import cdb from '../../services/cocktailDBAPI/cocktailDBAPI.js';
import utility from '../../services/utility/utility.js';

class DrinkList extends Component {
  constructor({ listName }) {
    super();
    this.state = {
      listName,
      drinkList: [],
      drinkView: false,
      drinkViewItem: {},
      removeTargetId: Number()
    };
    this.clearRemoveTargetTimeout = undefined;
    this.CRTTWait = 2000;
    this.sortModes = {
      score: (item1, item2) => {
        const score1 = item1.score;
        const score2 = item2.score;
        return score1 > score2;
      }
    }

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
    const drinkList = drinkLists.getList(listName);
    drinkList.then(data => {
      self.assureMount(() => self.setState({ drinkList: data }));
    });
    drinkLists.subscribeAll({
      callback({ allLists }) {
        self.assureMount(() => self.initializeState(self.state.listName));
      }
    })

    this.handleRecipeClick = this.handleRecipeClick.bind(this);
    this.handleRemoveClick = this.handleRemoveClick.bind(this);
    this.initializeState = this.initializeState.bind(this);
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

  componentDidUpdate() {
    const { listName: oldListName } = this.state;
    const { listName: newListName } = this.props;
    if (oldListName !== newListName) {
      this.initializeState(newListName);
    }
  }

  async initializeState(listName) { 
    const drinkList = utility.sortArray({
      arr: await drinkLists.getList(listName),
      compare: this.sortModes.score
    });
    const newState = {
      listName,
      drinkList,
      drinkView: false,
      drinkViewItem: {},
      removeTargetId: undefined
    };
    this.setState(newState);
  }

  async handleRecipeClick(e, item) {
    const result = await cdb.constructSearch({
      type: "cocktail",
      focus: "byId",
      text: item.id
    });

    this.setState({drinkView: true, drinkViewItem: result[0]});
  }

  handleRemoveClick(e, item) {
    const { clearRemoveTargetTimeout, CRTTWait } = this; 
    const { removeTargetId, listName } = this.state;

    const alreadyTarget = (item.id === removeTargetId);
    if (alreadyTarget) {
      drinkLists.removeItemsByCheck({ listName, removalCheck: (item) => {
        const result = item.id === removeTargetId;
        return result;
      } });
    } else {
      this.setState({ removeTargetId: item.id });
      if (clearRemoveTargetTimeout) clearTimeout(clearRemoveTargetTimeout);

      const self = this;
      const clearTarget = () => {
        self.setState({ removeTargetId: undefined });
      };

      this.clearRemoveTargetTimeout = setTimeout(clearTarget, CRTTWait);
    }
  }

  render() {
    const { handleRecipeClick, handleRemoveClick } = this;

    const { drinkList, listName, drinkView, drinkViewItem, removeTargetId } = this.state;

    const noItemDefault = <div className="flex-center-center large-list-card no-results-text">
      No items in list yet
    </div>;

    let listItems = (drinkList || []).map(item => {
      return <div key={ item.id } className="list-card">
        <div className="medium-tag flex-grow no-text-edit">{ item.name }</div>
        <div onClick={ (e) => {handleRecipeClick(e, item)} } className="medium-button space-right clickable hover-darken">Recipe</div>
        <DrinkScore drinkId={ item.id } size="70"></DrinkScore>
        <div
          onClick={ (e) => { handleRemoveClick(e, item) } }
          className="small-icon space-left clickable">
          { (removeTargetId === item.id) ? "\u2713" : "X" }
        </div>
      </div>
    });

    if (listItems.length === 0) listItems = noItemDefault;

    const drinkViewStyle = {
      height: "700px",
      maxHeight: "700px",
      width: "700px",
      maxWidth: "700px",
      position: "relative"
    };

    const drinkViewElement = (!drinkView) ? "" :
      <div 
        className="full-fixed top-header-gap flex-center-center transparent-darken"
        onClick={ (e) => {e.stopPropagation(); this.setState({ drinkView: false })} }>
        <div onClick={ (e) => e.stopPropagation() } style={ drinkViewStyle }>
          <div onClick={ () => {this.setState({drinkView: false})} } className="absolute-top-right close-button clickable"></div>
          <DrinkView drinkInfo={ drinkViewItem }></DrinkView>
        </div>
      </div>

    return <div className="drink-list-wrapper">
      <div className="list-header-card full-border">{ listName }</div>
      { listItems }
      { drinkViewElement }
    </div>
  }
}

export default DrinkList;
