import React, { Component } from 'react';
import './LiquorShelfManager.css';

import cdb from '../../services/cocktailDBAPI/cocktailDBAPI.js';
import utility from '../../services/utility/utility.js';
import liquorShelf from '../../services/liquorShelf/liquorShelf.js';

class LiquorShelfManager extends Component {
  constructor() {
    super();
    this.state = {
      liquorList: [],
      liquorRef: [],
      glassList: [],
      glassRef: []
    };

    this.mounted = false;
    this.onMountQueue = [];
    this.assureMount = (func) => {
      if (this.mounted) {
        func();
      } else {
        this.onMountQueue.push(func);
      }
    }

    const liquorRefResult = liquorShelf.getLiquorRef();
    const glassRefResult = liquorShelf.getGlassRef();
    const ingredientResult = liquorShelf.getIngredientList();
    const glassResult = liquorShelf.getGlassList();
    Promise.all([liquorRefResult, glassRefResult, ingredientResult, glassResult])
      .then(([liquorRef, glassRef, liquorList, glassList]) => {
        this.assureMount(
          () => this.setState({ liquorRef, glassRef, liquorList, glassList })
        );
      })

    utility.EventEmitter.subscribe("new-user-data-loaded", ({ liquorShelf: ls }) => {
      const { liquorRef, glassRef } = liquorShelf.parseLiquorShelf(ls);
      ls = liquorShelf.parseLiquorShelf(ls);
      this.assureMount(
        () => this.setState({
          liquorRef,
          glassRef
        })
      );
    })

    this.handleLiquorNameClick = this.handleLiquorNameClick.bind(this);
    this.handleGlassNameClick = this.handleGlassNameClick.bind(this);
  }

  componentDidMount() {
    this.onMountQueue.forEach(func => func());
    this.mounted = true;
    this.onMountQueue = [];
  }

  toggleIngredient(liquorName) {
    liquorShelf.toggleLiquorState(liquorName);
    const liquorRefResult = liquorShelf.getLiquorRef();
    liquorRefResult.then(liquorRef => {
      this.setState({ liquorRef });
    });
  }

  handleLiquorNameClick(e, liquorName) {
    this.toggleIngredient(liquorName);
  }

  toggleGlass(glassName) {
    liquorShelf.toggleGlassState(glassName);
    const glassRefResult = liquorShelf.getGlassRef();
    glassRefResult.then(glassRef => {
      this.setState({ glassRef });
    })
  }

  handleGlassNameClick(e, glassName) {
    this.toggleGlass(glassName);
  }

  getIngredientsOwned() {
    const { liquorRef, liquorList } = this.state;
    const number = liquorList.reduce(({ total, owned }, liquorName) => {
      const state = liquorRef[liquorName];
      return {
        total: ++total,
        owned: (state) ? ++owned : owned
      }
    }, { total: 0, owned: 0 });
    return number;
  }

  getGlassesOwned() {
    const { glassRef, glassList } = this.state;
    const number = glassList.reduce(({ total, owned }, glassName) => {
      const state = glassRef[glassName];
      return {
        total: ++total,
        owned: (state) ? ++owned : owned
      };
    }, { total: 0, owned: 0 });
    return number;
  }

  render() {
    const { handleLiquorNameClick, handleGlassNameClick } = this;
    const { liquorList, liquorRef, glassList, glassRef } = this.state;
    
    const ingredients = this.getIngredientsOwned();
    const glasses = this.getGlassesOwned();

    const getListItem = (reference, onClick) => {
      return (targetName) => {
        const className = `list-card clickable hover-darken ${reference[targetName] ? 'green-tint' : ''}`;
        return <div
          key={ targetName }
          onClick={ (e) => { onClick(e, targetName) } }
          className={ className }>
          {targetName}
        </div>;
      }
    }

    const liquorListItem = getListItem(liquorRef, handleLiquorNameClick);
    const glassListItem = getListItem(glassRef, handleGlassNameClick);

    const scrollClass = "down-scrollable full-border no-left-border no-top-border flex-normalize";

    return <div className="liquor-shelf-wrapper">
      <div className="list-header-card space-bottom medium-text">
        Keep track of what glassware and ingredients you have. Ingredients and glassware that you have tracked here will have a checkmark next to them when using the Drink Search or viewing a Recipe.
      </div>
      <div className="liquor-shelf-inner-wrapper">
        <div className="flex-column-stretch-start">
          <div className="list-header-card">
            { `Glass List (${glasses.owned}/${glasses.total})` }
          </div>
          <div className={ scrollClass }>
            { glassList.map(glassName => glassListItem(glassName)) }
          </div>
        </div>
        <div className="flex-column-stretch-start">
          <div className="list-header-card">
            { `Ingredients List (${ingredients.owned}/${ingredients.total})` }
          </div>
          <div className={ scrollClass }>
            { liquorList.map(liquorName => liquorListItem(liquorName)) }
          </div>
        </div>
      </div>
    </div>
  }
}

export default LiquorShelfManager;
