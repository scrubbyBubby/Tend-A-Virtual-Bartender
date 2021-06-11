import React, { Component } from 'react';
import './DrinkScore.css';

import userScores from '../../services/userScores/userScores.js';
import utility from '../../services/utility/utility.js';

class DrinkScore extends Component {
  constructor({ size, value, drinkId }) {
    super();
    const self = this;
    this.state = {
      id: drinkId,
      value: value || 0,
      size: size || 100
    }

    this.drinkId = drinkId;

    const valuePromise = userScores.getScore(drinkId);
    valuePromise.then(data => {
      this.setState({ value: data });
    })

    this.mainId = utility.getUniqueId();

    let callback = ({ scores }) => {
      const found = scores.some(score => {
        if (score.drinkId === self.state.id) {
          self.setState({ value: score.score });
          self.forceUpdate();
          return true;
        }
        return false;
      });
      if (!found) {
        self.setState({ value: 0 });
        self.forceUpdate();
      }
    }
    callback = callback.bind(this);

    userScores.subscribeAll({ callback });

    utility.EventEmitter.subscribe("new-user-data-loaded", ({ userScores }) => {
      let score = userScores.find(score => score.drinkId === this.state.drinkId) || {score: 0};
      this.setState({
        value: score.score
      });
    })

    this.setScore = this.setScore.bind(this);
    this.keypressHandler = this.keypressHandler.bind(this);
    this.handleMainClick = this.handleMainClick.bind(this);
  }

  getCircleData() {
    const size = this.state.size;
    const boxSize = `${size}px`;
    const center = size * 0.5;
    const strokeWidth = 10 * size * 0.01;
    const radius = center - (strokeWidth * 0.5);
    const circumference = Math.PI * radius * 2;
    const fontSize = `${Math.floor(radius * 0.8)}px`;

    return {
      size,
      center,
      strokeWidth,
      radius,
      circumference,
      fontSize,
      boxSize
    };
  }

  getOffset(value, circumference) {
    return circumference - (circumference * (value / 100));
  }

  getCircleSVG(strokeOpacity = 1, additionalStyle = {}, circleData) {
    circleData = circleData || this.getCircleData();
    const {size, center, strokeWidth, radius} = circleData;
    return <svg height={ size } width={ size } style={additionalStyle}>
      <circle cx={ center } cy={ center } r={ radius } stroke="black" strokeOpacity={ strokeOpacity } strokeWidth={ strokeWidth } fill="none"></circle>
    </svg>
  }

  setScore(e) {
    let newScore = parseInt(e.target.value);
    if (!isNaN(newScore)) {
      userScores.setScore(this.props.drinkId, newScore);
      this.setState({value: newScore});
    }
    e.target.value = "";
  }

  keypressHandler(event) {
    if (event.key === "Enter") {
      document.querySelector(`#${this.mainId}`).querySelector('.score-value').blur();
    }
    if (isNaN(parseInt(event.key))) {
      event.preventDefault();
    }
  }

  inputHandler(event) {
    const value = parseInt(event.target.innerText);
    if (value > 100) {
      event.target.innerText = "100";
    } else if (event.target.innerText.trim() === "") {
      event.target.innerText = "0";
    }
  }

  handleMainClick(e) {
    const input = document.querySelector(`#${this.mainId} .score-value`);
    if (input) {
      input.focus();
      input.select();
    }
  }

  render() {
    const circleData = this.getCircleData();
    const { boxSize, circumference, fontSize } = circleData;
    const offset = this.getOffset(this.state.value, circumference);

    return <div id={ this.mainId } 
      className="drink-score clickable" 
      style={{width: boxSize, height: boxSize}}
      onClick={ this.handleMainClick }>
      <div className="score-circle shadow">
        { this.getCircleSVG(0.2, {}, circleData) }
      </div>
      <div className="score-circle">
        { this.getCircleSVG(1, {strokeDasharray: circumference, strokeDashoffset: offset}, circleData)}
      </div>
      <div className="flex-center-center absolute-box">
        <textarea
          onBlur={ this.setScore }
          onKeyPress={ this.keypressHandler }
          onInput={ this.inputHandler }
          className="score-value no-click"
          style={{fontSize: fontSize}}
          placeholder={ `${this.state.value || 0}` }
        ></textarea>
      </div>
    </div>
  }
}

export default DrinkScore;
