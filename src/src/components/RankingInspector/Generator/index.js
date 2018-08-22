import React, { Component } from "react";
import { Alert, Button, FormGroup, FormText, Input, Label, Badge,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { TreeSelect } from 'antd';
import Slider from 'react-rangeslider';

import styles from "./styles.scss";

const TreeNode = TreeSelect.TreeNode;

class Menubar extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false,
      dataset: {},
      ranking: {},
      value: 'ddd'
    };
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  onChange = (value) => {
    console.log(value);
    this.setState({ value });
  }

  render() {
    return (
      <div className={styles.Generator}>
        <div className={styles.selectSensitiveAttr}>SENSITIVE ATTRIBUTE</div>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret>
            Dropdown
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>Header</DropdownItem>
            <DropdownItem disabled>Action</DropdownItem>
            <DropdownItem>Another Action</DropdownItem>
            <DropdownItem divider />
            <DropdownItem>Another Action</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.selectFeatures}>SELECT FEATURES</div>
        <TreeSelect
          showSearch
          style={{ width: 300 }}
          value={this.state.value}
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          placeholder="Please select"
          allowClear
          multiple
          treeDefaultExpandAll
          onChange={this.onChange} >
          <TreeNode value="parent 1" title="parent 1" key="0-1">
            <TreeNode value="parent 1-0" title="parent 1-0" key="0-1-1">
              <TreeNode value="leaf1" title="my leaf" key="random" />
              <TreeNode value="leaf2" title="your leaf" key="random1" />
            </TreeNode>
            <TreeNode value="parent 1-1" title="parent 1-1" key="random2">
              <TreeNode value="sss" title={<b style={{ color: '#08c' }}>sss</b>} key="random3" />
            </TreeNode>
          </TreeNode>
        </TreeSelect>
        <div className={styles.selectMethod}>METHOD</div>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle caret>
            Method
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>Header</DropdownItem>
            <DropdownItem disabled>Action</DropdownItem>
            <DropdownItem>Another Action</DropdownItem>
            <DropdownItem divider />
            <DropdownItem>Another Action</DropdownItem>
          </DropdownMenu>
        </Dropdown>
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
        <div className={styles.groupFairness}>
          <input type="checkbox" />&nbsp;&nbsp;Statistical parity
        </div>
        <div className={styles.groupFairness}>
          <input type="checkbox" />&nbsp;&nbsp;Conditional parity(TP)
        </div>
        <div className={styles.groupFairness}>
          <input type="checkbox" />&nbsp;&nbsp;Conditional parity(FP)
        </div>
        <div className={styles.runButtonWrapper}>
          <Button className={styles.buttonGenerateRanking} color="danger">RUN</Button>
        </div>
      </div>
    );
  }
}

export default Menubar;
