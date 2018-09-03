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
          <Steps size='small' current={4} className={styles.ProcessIndicator}>
            <Step className={styles.step1} title="Generate" icon={<Icon type="check-circle" theme="filled" />} />
            <Step className={styles.step2} title="Explore" icon={<Icon type="check-circle" theme="filled" />} />
            <Step className={styles.step3} title="Analyze" icon={<Icon type="check-circle" theme="filled" />} />
            <Step className={styles.step4} title="Produce" icon={<Icon type="check-circle" theme="filled" />} />
            <Step className={styles.step5} title="Compare" icon={<Icon type="check-circle" theme="filled" />} />
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

export default Menubar;
