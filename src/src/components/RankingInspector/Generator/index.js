import React, { Component } from "react";
import { Alert, Button, FormGroup, FormText, Input, Label,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { TreeSelect, Slider, InputNumber, Badge } from 'antd';

import styles from "./styles.scss";

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
      value: 'ddd',
      rankingInstance: {
        rankingId: '',
        sensitiveAttr: '',
        features: [],
        target: '',
        method: ''
      },
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
    this.props.onRunningModel(this.state.rankingInstance);
  }

  onChange = (value) => {
    this.setState({ value });
  }

  renderSensitiveAttrSelections() {
    let wholeDataset = this.props.wholeDataset,
        exceptForIdColumn = 'id';

    // Extract all feature names (every column except for idx)
    let allColumns = Object.keys(wholeDataset[0]),
        allFeatures = allColumns.filter((d) => d !== exceptForIdColumn);

    return allFeatures.map((feature) => 
        (<DropdownItem 
          value={feature}
          onClick={this.handleClickSensitiveAttr}>
          {feature}
        </DropdownItem>));
  }

  renderTargetSelections() {
    let wholeDataset = this.props.wholeDataset,
        exceptForIdColumn = 'id';

    // Extract all feature names (every column except for idx)
    let allColumns = Object.keys(wholeDataset[0]),
        allFeatures = allColumns.filter((d) => d !== exceptForIdColumn);

    return allFeatures.map((feature) => 
        (<DropdownItem 
          value={feature}
          onClick={this.handleClickTarget}>
          {feature}
        </DropdownItem>));
  }

  renderFeatureSelections() {
    let wholeDataset = this.props.wholeDataset,
        exceptForIdColumn = 'id';

    // Extract all feature names (every column except for idx)
    let allColumns = Object.keys(wholeDataset[0]),
        allFeatures = allColumns.filter((d) => d !== exceptForIdColumn);

    return allFeatures.map((feature) => 
        (<TreeNode value={feature} 
                   title={feature}>
        </TreeNode>));
  }

  onTopkChange = (value) => {
    this.setState({
      topkInput: value,
    });
  }

  render() {
    let wholeDataset = this.props.wholeDataset,
        features = wholeDataset;  // Extract keys

    return (
      <div className={styles.Generator}>
        <div className={styles.generatorTitleWrapper}>
          <Badge className={styles.generatorTitle} status="success" text='Generator'/>
          <br />
        </div>
        {/* // Sensitive Attribute selector */}
        <div className={styles.selectSensitiveAttr}>Sensitive attribute</div>
        <Dropdown className={styles.sensitiveAttrDropdown} 
                  isOpen={this.state.sensitiveAttrDropdownOpen} 
                  toggle={this.toggleSensitiveAttrDropdown}>
          <DropdownToggle className={styles.sensitiveAttrDropdownToggle} caret>
            {this.props.rankingInstance.sensitiveAttr}
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
          value={this.props.rankingInstance.features}
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          placeholder="Please select"
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
            {this.props.rankingInstance.target}
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
            {this.props.rankingInstance.method}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>RankSVM</DropdownItem>
            <DropdownItem disabled>SVM</DropdownItem>
            <DropdownItem>Logistic Regression</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.topkSelector}>
          <div className={styles.selectTopk}>Top-k</div>
          <Slider min={1} max={20} onChange={this.onTopkChange} value={this.props.topk} />
          <InputNumber
            min={1}
            max={20}
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
