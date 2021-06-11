import React, { Component } from 'react';
import './Autocomplete.css';

import utility from '../../services/utility/utility.js';

class Autocomplete extends Component {
  constructor({ info, watchList }) {
    super();
    this.defaultValues = {
      debounce: 500,
      hide: true,
      hideOnlyWhenEmpty: false,
      inputStyling: {},
      listSyling: {},
      placeholder: "",
      initialLookupText: "",
      lookup: undefined,
      render: undefined,
      select: undefined,
      backflow: undefined,
      noResults: undefined
    };

    this.state = {
      id: utility.getUniqueId(),
      info: Object.assign(this.defaultValues, info),
      hiding: true,
      lookupResults: [],
      closingTimeout: undefined,
      watchRef: {}
    };

    this.selectedRecently = false;
    this.closingWaitTime = 1000;

    this.lookupInput = this.lookupInput.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.tryOpening = this.tryOpening.bind(this);
    this.tryClosing = this.tryClosing.bind(this);
  }

  componentDidMount() {
    const handleWatchList = () => {
      if (this.props.watchList) {
        const self = this;
        const initialWatchRef = {};
        this.props.watchList.forEach(({ id, alias, initial, handler, handlerType, onUpdate }) => {
          initialWatchRef[alias] = initial;
          const ele = document.querySelector(`#${id}`);
          ele.addEventListener(handlerType, function(e) {
            const watchRef = Object.assign(self.state.watchRef, {[alias]: handler(e)});
            self.setState({
              watchRef
            });
            const updateProtocols = {
              lookup: () => {
                const input = document.querySelector(`#${self.state.id} .autocomplete-input`);
                const mockEvent = {
                  target: {
                    innerText: input.innerText
                  }
                };
                self.lookupInput(mockEvent, watchRef);
              },
              sort: () => {
                self.resortResults(watchRef);
              }
            };
            if (onUpdate) {
              onUpdate.forEach(update => { updateProtocols[update]() });
            }
          })
        });
        this.setState({watchRef: initialWatchRef});
      }
    };

    const handlePlaceholderEvents = () => {
      const ele = document.querySelector(`#${this.state.id} .autocomplete-input`);
      const placeholder = ele.getAttribute('data-placeholder');
      const { initialLookupText } = this.state.info;
      if (initialLookupText === '') {
        ele.innerHTML = placeholder;
        ele.style.color = "rgba(0,0,0,0.5)";
      } else {
        ele.innerHTML = initialLookupText;
      }
  
      ele.addEventListener('focus', function(e) {
        const value = e.target.innerText.trim();
        if (value === placeholder) {
          e.target.innerHTML = "";
        }
      })
  
      ele.addEventListener('input', function(e) {
        const value = e.target.innerText.trim();
        if (value === "") {
          e.target.innerHTML = placeholder;
          e.target.innerHTML = "";
          e.target.style.color = "rgba(0,0,0,0.5)";
        } else {
          e.target.style.color = "rgba(0,0,0,1)";
        }
      })
  
      ele.addEventListener('blur', function(e) {
        const value = e.target.innerText.trim();
        if (value === '') {
          e.target.innerHTML = placeholder;
          e.target.style.color = "rgba(0,0,0,0.5)";
        }
      })
    };

    handleWatchList();
    //handlePlaceholderEvents();
  }

  async lookupInput(event, watchRef) {
    watchRef = watchRef || this.state.watchRef;
    let lookupResults = await this.props.info.lookup(event, watchRef);
    if (this.state.info.sort) {
      lookupResults = this.state.info.sort(lookupResults, watchRef);
    }
    this.setState({ lookupResults });
  }

  resortResults(watchRef) {
    watchRef = watchRef || this.state.watchRef;
    const { sort } = this.state.info;
    if (sort) {
      const sortedResults = sort(this.state.lookupResults, watchRef);
      this.setState({ lookupResults: sortedResults });
    }
  }

  async tryOpening(e) {
    if (this.selectedRecently) {
      await this.lookupInput(e);
      this.selectedRecently = false;
    }

    this.setState({ hiding: false });
  }

  tryClosing() {
    const self = this;
    const el = document.querySelector(`#${self.state.id} .autocomplete-input`);
    const text = el.innerText.trim();
    if (text === "" || !self.state.info.hideOnlyWhenEmpty) {
      if (self.closingTimeout === undefined) {
        const maxWait = self.closingWaitTime;
        self.closingTimeout = setTimeout(() => {
          self.setState({ hiding: true })
          self.closingTimeout = undefined;
        }, maxWait);
      }
    }
  }

  selectItem(result) {
    this.tryClosing();

    if (this.state.info.backflow) {
      const input = document.querySelector(`#${this.state.id} .autocomplete-input`);
      input.innerText = this.state.info.backflow(result);
    }

    this.state.info.select(result);
    this.selectedRecently = true;
  }

  render() {
    const { id, hiding, lookupResults } = this.state;
    const info = Object.assign(this.defaultValues, this.props.info);
    const { hide, listStyling, inputStyling, render, noResults, placeholder } = info;

    const forceHide = (hide && hiding);
    const zeroResults = (lookupResults.length === 0);
    const zeroResultDisplay = (zeroResults && noResults && !hide) ? noResults() : '';

    const autocompleteItems = forceHide ? '' : 
      zeroResults ? zeroResultDisplay :
      <div className="autocomplete-items" style={ listStyling }>
        { lookupResults.map(result => 
          <div className="autocomplete-item"
            key={ result.key }
            onClick={ () => { this.selectItem(result) } }
          >{ render(result) }</div>
        ) }
      </div>;

    return <div id={ id } className="autocomplete-wrapper">
      <div className="space-left label-text">{ placeholder }</div>
      <div spellcheck="false" className="autocomplete-input content-editable"
        style={ inputStyling }
        contentEditable
        onInput={ utility.debounce(this.lookupInput) }
        onFocus={ this.tryOpening }
        onBlur={ this.tryClosing }
      ></div>
      { autocompleteItems }
    </div>
  }
}

export default Autocomplete;
