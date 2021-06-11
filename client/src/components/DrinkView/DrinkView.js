import React, { Component } from 'react';
import './DrinkView.css';

import DrinkScore from '../DrinkScore/DrinkScore.js';
import userScores from '../../services/userScores/userScores.js';
import liquorShelf from '../../services/liquorShelf/liquorShelf.js';

class DrinkView extends Component {
  constructor({ drinkInfo }) {
    super();
    const defaultDrinkInfo = {
      name: "",
      score: 100,
      glass: "",
      ingredients: [],
      recipe: [],
      notes: ""
    };

    this.state = {
      drinkInfo: Object.assign(defaultDrinkInfo, drinkInfo)
    };

    this.sectionTags = {
      score: "Score:",
      glass: "Glass:",
      ingredients: "Needs:",
      recipe: "Method:",
      notes: "Notes:"
    };
  }

  componentDidUpdate() {
    const { id } = this.props.drinkInfo;
    const scoreResult = userScores.getScore(id);
    scoreResult.then(score => {
      userScores.setScore(id, score);
    });
  }

  render() {
    const { 
      name,
      id,
      score = 0,
      glass,
      ingredients = [],
      simpleIngredients = [],
      recipe = [],
      notes
    } = this.props.drinkInfo;

    const st = this.sectionTags;

    const checkElement = <span className="medium-text">{ " \u2713" }</span>;

    return <div className="drink-view">
      <div className="header">{ name }</div>
      <div className="drink-info">
        <div className="score">
          <div className="large-tag">{ st.score }</div>
          <DrinkScore size="100" value={ score } drinkId={ id }></DrinkScore>
        </div>
        <div className="glass-wrapper">
          <div className="glass">
            <div className="medium-tag">
              { st.glass }
            </div>
            <div className="fancy-text large-text">{ glass + " " + (liquorShelf.checkGlassRef(glass) ? "\u2713" : "") }</div>
          </div>
        </div>
        <div className="ingredients-wrapper">
          <ul className="ingredients no-ul-style">
            <div className="medium-tag">{ st.ingredients }</div>
            <div className="ingredient-list">
              { simpleIngredients.map((ingredient, index) => {
                const checkItem = liquorShelf.checkLiquorRef(ingredient);
                const complexIngredient = ingredients[index];
                return <li className="ingredient" key={ ingredient }>{ complexIngredient + " " + (checkItem ? "\u2713" : "") }</li>
              }) }
            </div>
          </ul>
        </div>
        <div className="recipe-wrapper">
          <ul className="recipe">
            <div className="medium-tag">{ st.recipe }</div>
            { recipe.map(step => {
              return <li className="step" key={ step }>{ step }</li>
            }) }
          </ul>
        </div>
        <div style={ { display: "none"} } className="notes-wrapper">
          <div className="notes">
            <div className="medium-tag">{ st.notes }</div>
            <div className="fancy-text medium">{ notes }</div>
          </div>
        </div>
      </div>
    </div>
  }
}

export default DrinkView;
