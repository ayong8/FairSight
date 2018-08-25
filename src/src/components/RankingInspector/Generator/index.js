import React, { Component } from "react";
import { Alert, Button, FormGroup, FormText, Input, Label, Badge,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { TreeSelect } from 'antd';
import Slider from 'react-rangeslider';

import styles from "./styles.scss";

const TreeNode = TreeSelect.TreeNode;

class Generator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sensitiveAttrDropdownOpen: false,
      methodDropdownOpen: false,
      dataset: {},
      ranking: {},
      value: 'ddd',
      rankingInstance: {
        rankingId: '',
        sensitiveAttr: '',
        features: [],
        target: '',
        method: ''
      }
    };

    this.toggleSensitiveAttrDropdown = this.toggleSensitiveAttrDropdown.bind(this);
    this.toggleMethodDropdown = this.toggleMethodDropdown.bind(this);
    this.handleClickSensitiveAttr = this.handleClickSensitiveAttr.bind(this);
    this.handleClickRun = this.handleClickRun.bind(this);
  }

  toggleSensitiveAttrDropdown() {
    this.setState({
      sensitiveAttrDropdownOpen: !this.state.sensitiveAttrDropdownOpen
    });
  }

  toggleMethodDropdown() {
    this.setState({
      methodDropdownOpen: !this.state.methodDropdownOpen
    });
  }

  handleClickSensitiveAttr(e) {
    let selectedSensitiveAttr = e.target.value;

    this.setState({
      rankingInstance: {
        sensitiveAttr: selectedSensitiveAttr
      }
    });
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

    return allFeatures.map((feature) => (<DropdownItem onClick={this.handleClickSensitiveAttr}>{feature}</DropdownItem>));
  }

  handleSelectSensitiveAttr() {

    //this.props.onSelectSensitiveAttr(sensitiveAttr)
  }

  handleClickRun() {
    this.props.onRunningModel(this.state.rankingInstance);
  }

  render() {
    let wholeDataset = this.props.wholeDataset,
        features = wholeDataset;  // Extract keys

    return (
      <div className={styles.Generator}>
        {/* // Sensitive Attribute selector */}
        <div className={styles.selectSensitiveAttr}>Sensitive attribute</div>
        <Dropdown size='sm' className={styles.sensitiveAttrDropdown} isOpen={this.state.sensitiveAttrDropdownOpen} toggle={this.toggleSensitiveAttrDropdown}>
          <DropdownToggle caret>
          Features
          </DropdownToggle>
          <DropdownMenu>
            {this.renderSensitiveAttrSelections()}
          </DropdownMenu>
        </Dropdown>
        {/* // Feature selector */}
        <div className={styles.selectFeatures}>Features</div>
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
        {/* // Method selector */}
        <div className={styles.selectMethod}>Method</div>
        <Dropdown size='sm' isOpen={this.state.methodDropdownOpen} toggle={this.toggleMethodDropdown}>
          <DropdownToggle caret>
            Methods
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>RankSVM</DropdownItem>
            <DropdownItem disabled>SVM</DropdownItem>
            <DropdownItem>Logistic Regression</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <div className={styles.runButtonWrapper}>
          <Button className={styles.buttonGenerateRanking} color="danger" onClick={this.handleClickRun}>RUN</Button>
        </div>
      </div>
    );
  }
}

export default Generator;
