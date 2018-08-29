import React, { Component } from "react";
import { Alert, FormGroup, FormText, Input, Label, Badge,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import Slider from 'react-rangeslider';
import { Button, Steps, Icon } from 'antd';

import styles from "./styles.scss";

class Menubar extends Component {
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

    //this.props.onSelectSensitiveAttr(sensitiveAttr); // Then declare it 
  }

  render() {
    const Step = Steps.Step;

    return (
      <div className={styles.Generator}>
        <div className={styles.appTitle}>FAIRSIGHT</div>
        <div className={styles.addDataset}>
          <span className={styles.addDatasetTitle}>Dataset</span>
          <Badge className={styles.currentDataset} color="success" pill>german.csv</Badge>
        </div>
        <div className={styles.addRanking}>
          <Button>+</Button>
        </div>
        <div className={styles.ranking}>
          Current ranking: &nbsp;
          <Badge className={styles.currentRanking} color="success" pill>R3</Badge>
        </div>
        <div className={styles.margin}>
          <Steps size='small' className={styles.ProcessIndicator}>
            <Step className={styles.step1} title="Generate" icon={<Icon type="right-circle-o" />} />
            <Step title="Explore" icon={<Icon type="right-circle-o" />} />
            <Step title="Analyze" icon={<Icon type="right-circle-o" />} />
            <Step title="Produce" icon={<Icon type="right-circle-o" />} />
            <Step title="Compare" icon={<Icon type="right-circle-o" />} />
          </Steps>
        </div>
        {/* <div className={styles.GeneratorNavBar}>
          <div className={styles.navBarDataset}>Dataset</div>
          <div className={styles.navBarInput}>
            <div className={styles.rankingId}>R-3</div>
            <div className={styles.inputSummary}>
              <div className={styles.inputTitle}>Input</div>
              <Badge className={styles.inputFeatures} color="success" pill>17 features</Badge>
              <Badge className={styles.inputSensitiveAttribute} color="warning" pill>Sex(Male, Female)</Badge>
            </div>
          </div>
          <div className={styles.navBarMethod}>Method</div>
          <div className={styles.navBarFairness}>Fairness</div>
        </div> */}
        {/* <DataLoader dataset={this.state.dataset} className={styles.DataLoader}/>
        <FeatureSelector className={styles.FeatureSelector}/>
        <MethodSelector className={styles.MethodSelector}/>
        <FairnessOrganizer className={styles.FairnessOrganizer}/> */}
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

export default Menubar;
