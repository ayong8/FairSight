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
        <div className={styles.GeneratorNavBar}>
          <div>Dataset</div>
          <div>Sensitive Attribute, Features: 17</div>
          <div>Method</div>
          <div>Fairness</div>
        </div>
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
        <div className={styles.generatorSubtitle}>1. Upload a dataset</div>
        <FormGroup>
          <Label for="exampleFile">File</Label>
          <Input type="file" name="file" id="exampleFile" />
          <FormText color="muted">
            GERMAN.csv
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
        <div className={styles.generatorSubtitle + ' ' + styles.firstTitle}>2. Select features and sensitive attributes</div>
        <div className={styles.secondTitle1}> Sensitive Attribute </div>
        <Dropdown className={styles.SensitiveAttrSelectorDropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret className={styles.SensitiveAttrSelectorDropdownToggle}>
            Sensitive Attribute
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Feature1</DropdownItem>
            <DropdownItem>Feature2</DropdownItem>
          </DropdownMenu>
          <div className={styles.sensitiveGroupIndicator}>
            <span className={styles.group1}>...</span> Men
            <br />
            <span className={styles.group2}>...</span> Women
          </div>
        </Dropdown>
        <div className={styles.secondTitle2}> Feature Selection </div>
        <Dropdown className={styles.FeatureSelectorDropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret className={styles.FeatureSelectorDropdownToggle}>
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
        <div className={styles.generatorSubtitle}>3. Select a method and top-k</div>
        <Dropdown className={styles.MethodSelectorDropdown} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret>
            Method
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem>Feature1</DropdownItem>
            <DropdownItem>Feature2</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.secondTitle2}> Top-K </div>
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
        <div className={styles.generatorSubtitle}>4. Adjust the fairness</div>
        <div className={styles.groupFairness}>Statistical parity</div>
        <div className={styles.groupFairness}>Conditional parity(TP)</div>
        <div className={styles.groupFairness}>Conditional parity(FP)</div>
        <div className={styles.runButtonWrapper}>
          <Button classNmae={styles.buttonGenerateRanking} color="danger">RUN</Button>
        </div>
      </div>
    );
  }
}

export default Generator;
