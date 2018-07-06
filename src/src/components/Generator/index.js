import React, { Component } from "react";
import { Alert, Button, FormGroup, FormText, Input, Label,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Slider from 'react-rangeslider';
import styles from "./styles.scss";

class Generator extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false,
      dataset: {},
      ranking: {}
    };
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  render() {
    return (
      <div className={styles.Generator}>
        <div>Dataset</div>
        <div>Sensitive Attribute, Features: 17</div>
        <div>Method</div>
        <div>Fairness</div>
        <DataLoader dataset={this.state.dataset} className={styles.DataLoader}/>
        <FeatureSelector className={styles.FeatureSelector}/>
        <MethodSelector className={styles.MethodSelector}/>
        <FairnessOrganizer className={styles.FairnessOrganizer}/>
        {/* <Dropdown className={styles.Dropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle} left>
          <DropdownToggle
            tag="span"
            onClick={this.toggle}
            data-toggle="dropdown"
            aria-expanded={this.state.dropdownOpen}
          >
            <span className={styles.DropdownToggle}>DOWN</span>
          </DropdownToggle>
          <DropdownMenu className={styles.DropdownMenu} right>
            <DataLoader className={styles.DataLoader}/>
            <FeatureSelector className={styles.FeatureSelector}/>
            <MethodSelector className={styles.MethodSelector}/>
            <FairnessOrganizer className={styles.FairnessOrganizer}/>
          </DropdownMenu>
        </Dropdown> */}
      </div>
    );
  }
}

class DataLoader extends Component {
  render(){
    return (
      <div className={styles.DataLoader}>
        <div>1. Upload a dataset</div>
        <FormGroup>
          <Label for="exampleFile">File</Label>
          <Input type="file" name="file" id="exampleFile" />
          <FormText color="muted">
            This is some placeholder block-level help text for the above input.
            It's a bit lighter and easily wraps to a new line.
          </FormText>
        </FormGroup>
      </div>
    );
  }
}

class FeatureSelector extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  render(){
    return (
      <div className={styles.FeatureSelector}>
        <div className={styles.firstTitle}>2. Select attributes and sensitive...</div>
        <div className={styles.secondTitle1}> Sensitive Attribute </div>
        <Dropdown className={styles.SensitiveAttrSelectorDropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret>
            Features
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Feature1</DropdownItem>
            <DropdownItem>Feature2</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.sensitiveAttrProperties}>
          Men, Women
        </div>
        <div className={styles.secondTitle2}> Feature Selection </div>
        <Dropdown className={styles.FeatureSelectorDropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret>
            Features
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Feature1</DropdownItem>
            <DropdownItem>Feature2</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }
}

class MethodSelector extends Component {
  constructor(props) {
    super(props);
    this.handleOnChange = this.handleOnChange.bind(this);

    this.state = {
      topK: 0
    }
  }

  handleOnChange(value) {  // For the top-k slider
    this.setState({
      topK: value
    });
  }

  render(){
    let { topK } = this.state;

    return (
      <div className={styles.MethodSelector}>
        <div className={styles.firstTitle}>3. Select a method and top-k</div>
        <Dropdown className={styles.MethodSelectorDropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret>
            Features
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Feature1</DropdownItem>
            <DropdownItem>Feature2</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <Slider
          value={topK}
          orientation="horizontal"
          onChange={this.handleOnChange}
        />
      </div>
    );
  }
}

class FairnessOrganizer extends Component {
  constructor(props) {
    super(props);
    this.toggleRun = this.toggleRun.bind(this);
  }

  toggleRun() { // Run button
    // Pass a generated ranking object to the rankingListView

  }
  render() {
    return (
      <div className={styles.FairnessOrganizer}>
        <Button classNmae={styles.buttonGenerateRanking} color="danger">RUN</Button>
      </div>
    );
  }
}

export default Generator;
