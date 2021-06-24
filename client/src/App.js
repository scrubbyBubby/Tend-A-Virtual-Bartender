import './App.css';
import React from 'react';
import DrinkSearch from './components/DrinkSearch/DrinkSearch.js';
import DrinkListManager from './components/DrinkListManager/DrinkListManager.js';
import LiquorShelfManager from './components/LiquorShelfManager/LiquorShelfManager.js';
import LoginSignUp from './components/LoginSignUp/LoginSignUp.js';

import cdb from './services/cocktailDBAPI/cocktailDBAPI.js';
import utility from './services/utility/utility.js';
import loginLogout from './services/loginLogout/loginLogout.js';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      mode: "mainMenu",
      drinkInfo: {},
      authOpen: false,
      loggedIn: false
    };
    this.select = this.select.bind(this);
    this.handleHeaderClick = this.handleHeaderClick.bind(this);
    this.handleDrinkSearchClick = this.handleDrinkSearchClick.bind(this);
    this.handleDrinkListsClick = this.handleDrinkListsClick.bind(this);
    this.handleLiquorShelfClick = this.handleLiquorShelfClick.bind(this);
    this.handleLoginClick = this.handleLoginClick.bind(this);

    this.mounted = false;
    this.onMountQueue = [];
    this.assureMount = (func) => {
      if (this.mounted) {
        func();
      } else {
        this.onMountQueue.push(func);
      }
    }

    utility.EventEmitter.subscribe("auth-open", ({ state }) => {
      this.assureMount(() => this.setState({ authOpen: state }));
    });
    utility.EventEmitter.subscribe("logged-in", ({ state }) => {
      this.assureMount(() => this.setState({ loggedIn: state}));
    })
  }

  async select(result) {
    const data = await cdb.constructSearch({
      type: "cocktail",
      focus: "byId",
      text: result.id
    });

    this.setState({drinkInfo: data[0]});
  }

  autocompleteInfo = {
    debounce: 500,
    inputStyling: {
      fontSize: "32px",
      padding: "5px 10px",
      height: "42px",
      margin: "10px 10px 0 10px"
    },
    listStyling: {
      maxHeight: "400px",
      overflowY: "auto",
      border: "1px solid black"
    },
    async lookup(data) {
      const text = data.target.innerText;
  
      const results = await cdb.constructSearch({
        type: "cocktail",
        focus: "byName",
        text
      });

      const sortedResults = utility.alphabetizeObjectArray(results, "name");
  
      return sortedResults;
    },
    render(result) {
      return <div className="basic-item">{ result.name }</div>
    },
    select: this.select.bind(this),
    backflow(result) {
      return result.name;
    }
  }

  componentDidMount() {
    this.onMountQueue.forEach(func => func());
    this.mounted = true;
    this.onMountQueue = [];
    loginLogout.checkSession({});
  }

  changeMode(mode) {
    this.setState({ mode });
  }

  handleHeaderClick(e) {
    this.changeMode('mainMenu');
  }

  handleDrinkSearchClick(e) {
    this.changeMode('drinkSearch');
  }

  handleDrinkListsClick(e) {
    this.changeMode('drinkLists');
  }

  handleLiquorShelfClick(e) {
    this.changeMode('liquorShelf');
  }

  handleLoginClick(e) {
    const { loggedIn } = this.state;
    if (!loggedIn) {
      this.setState({ authOpen: true });
    } else {
      const onSuccess = (res) => {
        console.log(`Logged out!`);
      };
      const onFail = (res) => {
        console.log(`Could not log out!`);
      };

      loginLogout.logout({}, onSuccess, onFail);
    }
  }

  getStylesByMode(mode) {
    const getStyle = (state) => {
      const newStyle = {};
      if (!state) newStyle["display"] = "none";
      return newStyle;
    }

    const result = {
      mainMenuStyle: getStyle(mode === 'mainMenu'),
      drinkSearchStyle: getStyle(mode === 'drinkSearch'),
      drinkListsStyle: getStyle(mode === 'drinkLists'),
      liquorShelfStyle: getStyle(mode === 'liquorShelf')
    }

    return result;
  }

  render() {
    const {
      handleHeaderClick,
      handleDrinkSearchClick,
      handleDrinkListsClick,
      handleLiquorShelfClick,
      handleLoginClick
    } = this;
    const { mode, authOpen, loggedIn } = this.state;
    const { mainMenuStyle, drinkSearchStyle, drinkListsStyle, liquorShelfStyle } = this.getStylesByMode(mode);

    const loginLogoutText = (loggedIn) ? "Log Out" : "Log In";

    const usernameElement = () => {
      let text = (loginLogout.user || {email: ""}).email;
      text = (text === "" || text === undefined) ? "..." : text;
      return <div className={ "small-text bold-text " + ((loggedIn) ? "" : "invisible") }>
        { text }
      </div>;
    }

    return (
      <div className="full-wrapper">
        <div onClick={ handleHeaderClick } 
          className="master-header clickable hover-darken relative"
          >
          Tend: A Virtual Bartender
          <div className="absolute-right flex-column flex-start-center min-w-150">
            { usernameElement() }
            <div onClick={ handleLoginClick } className="oval-button">{ loginLogoutText }</div>
          </div>
        </div>
        <div className="test-wrapper">
          <LoginSignUp open={ authOpen }></LoginSignUp>
          <div style={ mainMenuStyle } className="test-sub-wrapper">
            <div className="main-menu-cover">
              <div onClick={ handleDrinkSearchClick } className="main-menu-search clickable hover-darken no-top-border">
                <div>
                  Drink Search
                </div>
                <div className="medium-text fancy-text">
                  Search for Cocktails or Non-Alcoholic beverages.
                </div>
              </div>
              <div onClick={ handleDrinkListsClick } className="main-menu-lists clickable hover-darken">
                <div>
                  Drink Lists
                </div>
                <div className="medium-text fancy-text">
                  View, Create, and Edit your lists of drinks
                </div>
              </div>
              <div onClick={ handleLiquorShelfClick } className="main-menu-liquor clickable hover-darken">
                <div>
                  Liquor Shelf
                </div>
                <div className="medium-text fancy-text">
                  Keep track of what ingredients and glassware you have
                </div>
              </div>
            </div>
          </div>
          <div style={ drinkSearchStyle } className="test-sub-wrapper">
            <DrinkSearch></DrinkSearch>
          </div>
          <div style={ drinkListsStyle } className="test-sub-wrapper">
            <DrinkListManager></DrinkListManager>
          </div>
          <div style={ liquorShelfStyle } className="test-sub-wrapper">
            <LiquorShelfManager></LiquorShelfManager>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
