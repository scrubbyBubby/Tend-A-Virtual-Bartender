import React, { Component } from 'react';
import './LoginSignUp.css';
import axios from "axios";

import utility from '../../services/utility/utility.js';
import loginLogout from '../../services/loginLogout/loginLogout.js';

class LoginSignUp extends Component {
  constructor({ open }) {
    super();
    this.state = {
      open: false,
      mode: "signIn",
      email: "",
      password: "",
      loggedIn: false,
      wrongPassword: false
    };

    utility.EventEmitter.subscribe("logged-in", ({ state }) => {
      this.setState({ loggedIn: state });
    });

    this.loggedInAnimationDuration = 100;
    this.loggedInAnimation = undefined;

    this.handleSignUpClose = this.handleSignUpClose.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleLoginFormSubmission = this.handleLoginFormSubmission.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    this.passwordValidations = [
      {
        text: "more than 7 characters",
        test: (password) => (password.length > 7)
      },{
        text: "less than 21 characters",
        test: (password) => (password.length < 21)
      },{
        text: "at least 1 symbol",
        test: (password) => new RegExp("(?=.*[!@#$%^&*])").test(password)
      },{
        text: "at least 1 number",
        test: (password) => new RegExp("(?=.*[0-9])").test(password)
      }
    ];

    this.emailValidations = [
      {
        text: "to be valid",
        test: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
      }
    ];
  }

  componentDidUpdate() {
    const propOpen = this.props.open;
    const stateOpen = this.state.open;
    if (propOpen !== stateOpen) {
      this.setState({ open: propOpen });
    }
  }

  loginUser() {
    if (this.loggedInAnimation) {
      clearTimeout(this.loggedInAnimation);
      this.loggedInAnimation = undefined;
    }

    setTimeout(() => {
      utility.EventEmitter.dispatch("auth-open", { state: false });
    }, this.loggedInAnimationDuration)
  }

  handleSignUpClose() {
    utility.EventEmitter.dispatch("auth-open", { state: false });
  }

  handleModeChange(e, newMode) {
    this.setState({ mode: newMode });
  }

  handleInputChange(e, stateName) {
    this.setState({ [stateName]: e.target.value });
  }

  handleLoginFormSubmission(e, validators) {
    e.preventDefault();
    const fail = validators.some((validator) => {
      return validator.some(validation => !validation.result);
    });

    if (!fail) {
      const { email, password } = this.state;
      const userData = { email, password };
  
      const self = this;
      const onSuccess = (res) => {
        self.loginUser();
      };
  
      const onFail = (res) => {
        if (res.data.message === "Wrong password") {
          this.setState({ wrongPassword: true });
        }
      };
  
      loginLogout.login(userData, onSuccess, onFail);
    }
  };

  checkValidations(input, validations) {
    return validations.map(validation => {
      return {
        ...validation,
        result: validation.test(input)
      }
    });
  }

  render() {
    const { open, mode, password, email, wrongPassword } = this.state;
    if (open === false) return <div></div>;

    const { handleSignUpClose, handleModeChange, handleLoginFormSubmission, handleInputChange, checkValidations } = this;

    const passwordValidations = checkValidations(password, this.passwordValidations);
    const emailValidations = checkValidations(email, this.emailValidations);

    const [ signInClassName, signUpClassName ] =
      ["signIn", "signUp"].map(modeName =>
        `flex-grow padding-10 flex-center-center hover-darken clickable ${modeName === mode ? "darken" : ""}`
      );

    const inputElement = ({ label, inputId, stateName, type }) =>
      <div className="flex-start-center">
        <div className="medium-text min-w-150 text-right">
          { label }:
        </div>
        <input type={ type } onChange={ (e) => handleInputChange(e, stateName) } id={ inputId } className="signin-text"></input>
      </div>;

    const validationElement = ({ mainText, validations }) => <div className="space-bottom padding-10 text-center flex-start-center">
      <div className="small-text min-w-150 text-right">{ mainText }</div>
      <div>
        { validations.map(validation => {
          const validationClass = (validation.result) ? "muted-text green-text bold-text" : "muted-text";
          return <div className={ validationClass }>
            { validation.text }
          </div>
        }) }
      </div>
    </div>;

    const wrongPasswordElement = () => {
      if (wrongPassword) {
        return <div className="muted-text red-text bold-text text-center">Wrong password</div>
      } else {
        return "";
      }
    }

    const formElement = ({ items, formId, submitText }) =>
      <form id={ formId } 
        className="flex-column flex-start-stretch w-100p padding-10 no-gap"
        onSubmit={ (e) => handleLoginFormSubmission(e, [passwordValidations, emailValidations]) }>
        { inputElement(items[0]) }
        { validationElement({ mainText: "Emails have:", validations: emailValidations }) }
        { inputElement(items[1]) }
        { wrongPasswordElement() }
        { validationElement({ mainText: "Passwords have:", validations: passwordValidations }) }
        <button type="submit" className="oval-button clickable align-self-center">{ submitText }</button>
      </form>;

    const inputRefs = {
      signIn: [
        { label: "Email", inputId: "sign-in-username", stateName: "email", type: "text"},
        { label: "Password", inputId: "sign-in-password", stateName: "password", type: "password"}
      ],
      signUp: [
        { label: "Email", inputId: "sign-up-username", stateName: "email", type: "text"},
        { label: "Password", inputId: "sign-up-password", stateName: "password", type: "password"}
      ]
    };

    const items = inputRefs[mode];
    const formId = ({
      signIn: "sign-in-form",
      signUp: "sign-up-form"
    })[mode];
    const submitText = ({
      signIn: "Submit!",
      signUp: "Sign Up!"
    })[mode];

    return <div className="full-fixed flex-center-center transparent-darken">
      <div className="w-500 flex-stretch-start flex-column list-w-outer-border relative">
        <div onClick={ handleSignUpClose }
          className="absolute-top-right close-button clickable">
        </div>
        <div className="list-header-card flex-stretch-start no-padding">
          <div className={ signInClassName }
            onClick={ (e) => handleModeChange(e, "signIn") }>
            Log In / Sign Up
          </div>
        </div>
        <div className="list-card">
          { formElement({ items, formId, submitText }) }
        </div>
      </div>
    </div>
  }
}

export default LoginSignUp;
