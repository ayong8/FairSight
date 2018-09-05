import React, { Component } from "react";
import { Alert, Button, FormGroup, FormText, Input, Label,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { TreeSelect, Slider, InputNumber, Icon } from 'antd';

import styles from "./styles.scss";
import index from '../../../index.css';

const TreeNode = TreeSelect.TreeNode;

class Generator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sensitiveAttrDropdownOpen: false,
      methodDropdownOpen: false,
      targetDropdownOpen: false,
      dataset: {},
      ranking: {},
      topkInput: 0
    };

    this.toggleSensitiveAttrDropdown = this.toggleSensitiveAttrDropdown.bind(this);
    this.toggleMethodDropdown = this.toggleMethodDropdown.bind(this);
    this.handleClickSensitiveAttr = this.handleClickSensitiveAttr.bind(this);
    this.handleSelectFeatures = this.handleSelectFeatures.bind(this);
    this.handleClickRun = this.handleClickRun.bind(this);
  }

  toggleSensitiveAttrDropdown() {
    this.setState({
      sensitiveAttrDropdownOpen: !this.state.sensitiveAttrDropdownOpen
    });
  }

  toggleTargetDropdown(){
    this.setState({
      targetDropdownOpen: !this.state.targetDropdownOpen
    });
  }

  toggleMethodDropdown() {
    this.setState({
      methodDropdownOpen: !this.state.methodDropdownOpen
    });
  }

  handleClickSensitiveAttr(e) {
    let selectedSensitiveAttr = e.target.value;
    this.props.onSelectRankingInstanceOptions({ sensitiveAttr: selectedSensitiveAttr });
  }

  handleClickTarget(e) {
    let selectedTarget = e.target.value;
    this.props.onSelectRankingInstanceOptions({ target: selectedTarget });
  }

  handleSelectFeatures(selectedFeatures) {
    console.log(selectedFeatures);
    this.props.onSelectRankingInstanceOptions({ features: selectedFeatures });
  }

  handleClickMethod(e) {
    let selectedMethod = e.target.value;
    this.props.onSelectRankingInstanceOptions({ method: selectedMethod });
  }

  handleClickRun() {
    this.props.onRunningModel();
  }

  onChange = (value) => {
    this.setState({ value });
  }

  renderSensitiveAttrSelections() {
    let dataset = this.props.dataset,
        exceptForIdColumn = 'id';

    // Extract all feature names (every column except for idx)
    let allColumns = Object.keys(dataset[0]),
        allFeatures = allColumns.filter((d) => d !== exceptForIdColumn);

    return allFeatures.map((feature) => 
        (<DropdownItem 
          value={feature}
          onClick={this.handleClickSensitiveAttr}>
          {feature}
        </DropdownItem>));
  }

  renderTargetSelections() {
    let dataset = this.props.dataset,
        exceptForIdColumn = 'id';

    // Extract all feature names (every column except for idx)
    let allColumns = Object.keys(dataset[0]),
        allFeatures = allColumns.filter((d) => d !== exceptForIdColumn);

    return allFeatures.map((feature) => 
        (<DropdownItem 
          value={feature}
          onClick={this.handleClickTarget}>
          {feature}
        </DropdownItem>));
  }

  renderFeatureSelections() {
    let dataset = this.props.dataset,
        exceptForIdColumn = 'id';

    // Extract all feature names (every column except for idx)
    let allColumns = Object.keys(dataset[0]),
        allFeatures = allColumns.filter((d) => d !== exceptForIdColumn);

    return allFeatures.map((feature) => 
        (<TreeNode value={feature} 
                   title={feature}>
        </TreeNode>));
  }

  onTopkChange = (value) => {
    this.setState({
      topkInput: value
    });
  }

  render() {
    return (
      <div className={styles.Generator}>
        <div className={styles.generatorTitleWrapper}>
          <Icon className={styles.step1} type="check-circle" theme="filled" /> &nbsp;
          <span className={styles.generatorTitle + ' ' + index.title}>Generator</span>
          <br />
        </div>
        {/* // Sensitive Attribute selector */}
        <div className={styles.selectSensitiveAttr}>Sensitive attribute</div>
        <Dropdown className={styles.sensitiveAttrDropdown} 
                  isOpen={this.state.sensitiveAttrDropdownOpen} 
                  toggle={this.toggleSensitiveAttrDropdown}>
          <DropdownToggle className={styles.sensitiveAttrDropdownToggle} caret>
            {this.props.data.sensitiveAttr}
          </DropdownToggle>
          <DropdownMenu>
            {this.renderSensitiveAttrSelections()}
          </DropdownMenu>
        </Dropdown>
        {/* // Feature selector */}
        <div className={styles.selectFeatures}>Features</div>
        <TreeSelect
          className={styles.featureSelector}
          showSearch
          style={{ width: 330 }}
          value={this.props.data.features}
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          placeholder='Please select'
          allowClear
          multiple
          treeDefaultExpandAll
          onChange={this.handleSelectFeatures} >
          {this.renderFeatureSelections()}
        </TreeSelect>
        {/* // Target variable selector */}
        <div className={styles.selectSensitiveAttr}>Target variable</div>
        <Dropdown className={styles.targetDropdown} 
                  isOpen={this.state.targetDropdownOpen} 
                  toggle={this.toggleTargetDropdown}>
          <DropdownToggle className={styles.targetDropdownToggle} caret>
            {this.props.data.target}
          </DropdownToggle>
          <DropdownMenu>
            {this.renderTargetSelections()}
          </DropdownMenu>
        </Dropdown>
        {/* // Method selector */}
        <div className={styles.selectMethod}>Method</div>
        <Dropdown className={styles.methodDropdown}
                  isOpen={this.state.methodDropdownOpen} 
                  toggle={this.toggleMethodDropdown}>
          <DropdownToggle className={styles.methodDropdownToggle} caret>
            {this.props.data.method}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>RankSVM</DropdownItem>
            <DropdownItem disabled>SVM</DropdownItem>
            <DropdownItem>Logistic Regression</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.topkSelector}>
          <div className={styles.selectTopk}>Top-k</div>
          <Slider min={1} max={this.props.n} onChange={this.onTopkChange} value={this.props.topk} />
          <InputNumber
            min={1}
            max={this.props.n}
            style={{ marginLeft: 16 }}
            value={this.props.topk}
            onChange={this.onTopkChange}
          />
        </div>
        <div className={styles.runButtonWrapper}>
          <Button className={styles.buttonGenerateRanking} color="danger" onClick={this.handleClickRun}>RUN</Button>
        </div>
      </div>
    );
  }
}

export default Generator;
