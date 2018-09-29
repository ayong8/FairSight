import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import { Alert, Button, FormGroup, FormText, Input, Label,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { TreeSelect, Slider, InputNumber, Icon, Table, Badge, Radio } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss';

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

    this.layout = {
      featureTable: {
        corr: {
          width: 60,
          height: 40
        }
      }
    }

    this.toggleSensitiveAttrDropdown = this.toggleSensitiveAttrDropdown.bind(this);
    this.toggleTargetDropdown = this.toggleTargetDropdown.bind(this);
    this.toggleMethodDropdown = this.toggleMethodDropdown.bind(this);
    this.handleClickSensitiveAttr = this.handleClickSensitiveAttr.bind(this);
    this.handleClickProtectedGroup = this.handleClickProtectedGroup.bind(this);
    this.handleSelectFeatures = this.handleSelectFeatures.bind(this);
    this.handleClickTarget = this.handleClickTarget.bind(this);
    this.handleClickMethod = this.handleClickMethod.bind(this);
    this.handleClickRun = this.handleClickRun.bind(this);
    this.handleClickGroup = this.handleClickGroup.bind(this);
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
    const selectedSensitiveAttr = e.target.value;
    this.props.onSelectRankingInstanceOptions({ sensitiveAttr: selectedSensitiveAttr });
  }

  handleClickProtectedGroup(e){
    const selectedProtectedGroup = e.target.value,
          groups = this.props.rankingInstance.sensitiveAttr.range;
    this.props.onSelectProtectedGroup({ 
      protectedGroup: selectedProtectedGroup, 
      nonProtectedGroup: groups.filter((group) => group !== selectedProtectedGroup)[0]
    });
  }

  handleClickTarget(e) {
    const selectedTarget = e.target.value;
    this.props.onSelectRankingInstanceOptions({ target: selectedTarget });
  }

  handleSelectFeatures(selectedFeatures) {
    this.props.onSelectRankingInstanceOptions({ features: selectedFeatures });
  }

  handleClickMethod(e) {
    const selectedMethod = e.target.value;
    this.props.onSelectRankingInstanceOptions({ method: selectedMethod });
  }

  handleClickRun() {
    this.props.onRunningModel();
  }

  handleClickGroup() {
  }

  onChange = (value) => {
    this.setState({ value });
  }

  renderSelectProtectedGroup() {
    const { rankingInstance } = this.props,
          { sensitiveAttr } = rankingInstance;
    const sensitiveAttrName = sensitiveAttr.name,
          group1 = sensitiveAttr.range[0],
          group2 = sensitiveAttr.range[1],
          protectedGroup = sensitiveAttr.protectedGroup,
          nonProtectedGroup = sensitiveAttr.nonProtectedGroup;

    return (
      <div className={styles.selectProtectedGroupWrapper}>
        <div className={styles.selectProtectedGroupTitle}>Select protected group</div>
        <Radio.Group 
          className={styles.protectedGroupRadioButton} 
          onChange={this.handleClickProtectedGroup} 
          defaultValue={group1} 
          buttonStyle='solid' 
          size='small'
        >
          <Radio.Button value={group1}>{group1}</Radio.Button>
          <Radio.Button value={group2}>{group2}</Radio.Button>
        </Radio.Group>
        <div className={styles.selectProtectedGroup}>
          <div className={styles.group1}>
            <Badge onClick={this.handleClickGroup} status='default' />
            {nonProtectedGroup}
          </div>
          <div className={styles.group2}>
            <Badge status='error' />
            {protectedGroup}
          </div>
        </div>
      </div>
    );
  }

  renderSensitiveAttrSelections() {
    const { features } = this.props;

    return features.map((feature, idx) => 
        (<DropdownItem 
          key={idx}
          value={feature.name}
          onClick={this.handleClickSensitiveAttr}>
          {feature.name}
        </DropdownItem>));
  }

  renderTargetSelections() {
    const { features } = this.props;

    return features.map((feature, idx) => 
        (<DropdownItem 
          key={idx}
          value={feature.name}
          onClick={this.handleClickTarget}>
          {feature.name}
        </DropdownItem>));
  }

  renderFeatureSelections() {
    const { features } = this.props;

    return features.map((feature) => 
        (<TreeNode value={feature.name} 
                   title={feature.name}>
        </TreeNode>));
  }

  renderFeatureSelectionsForTable() {
    const _self = this;
    const { features } = this.props;

    return features.map((feature) => {
      const featureName = feature.name;

      if (featureName === 'credit_amount')
        return {
          feature: featureName.replace(/_/g, ' '),
          dist: 10,
          corr: _self.renderCorrPlotWithSensitiveAttr(featureName)
        };
      else
        return {
          feature: featureName.replace(/_/g, ' '),
          dist: 10,
          corr: 10
        };
      });
  }

  renderCorrPlotWithSensitiveAttr(feature) {
    const _self = this;

    const { rankingInstance } = this.props,
          { instances } = rankingInstance;

    const dataGroup1 = _.chain(instances)
              .filter((d) => d.group === 0)
              .map((d) => d.features[feature])
              .value(),
          dataGroup2 = _.chain(instances)
              .filter((d) => d.group === 1)
              .map((d) => d.features[feature])
              .value(),
          featureValues = _.map(instances, (d) => d.features[feature]),
          nBins = 10,
          min = d3.min(featureValues),
          max = d3.max(featureValues),
          step = Math.floor((max-min) / nBins),
          thresholds = d3.range(min, max, step);
    
    const dataBin = d3.histogram()
                  .domain(d3.extent(featureValues))
                  .thresholds(thresholds)
                  (featureValues),
          dataBinGroup1 = d3.histogram()
                  .domain(d3.extent(featureValues))
                  .thresholds(thresholds)
                  (dataGroup1),
          dataBinGroup2 = d3.histogram()
                  .domain(d3.extent(featureValues))
                  .thresholds(thresholds)
                  (dataGroup2);

    const svgCorrPlot = new ReactFauxDOM.Element('svg');

    svgCorrPlot.setAttribute('width', _self.layout.featureTable.corr.width);
    svgCorrPlot.setAttribute('height', _self.layout.featureTable.corr.height);
    svgCorrPlot.setAttribute('0 0 100 100');
    svgCorrPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgCorrPlot.setAttribute('class', 'svg_corr_plot_' + feature);

    // Both groups share the same x and y scale
    const xScale = d3.scaleBand()
                  .domain(dataBin.map((d) => d.x0))
                  .range([0, _self.layout.featureTable.corr.width]),
          yScale = d3.scaleLinear()
                  .domain(d3.extent(dataBin, (d) => d.length))
                  .range([_self.layout.featureTable.corr.height, 0]);
          // xAxis = d3.select(svg)
          //     .append('g')
          //     .attr('transform', 'translate(0,0)')
          //     .call(d3.axisBottom(xScale).tickSize(0).tickFormat(''));

    let groupHistogramBar1, groupHistogramBar2;

    groupHistogramBar1 = d3.select(svgCorrPlot).selectAll('.g_corr_plot_group1_' + feature)
          .data(dataBinGroup1)
          .enter().append('g')
          .attr('class', 'g_corr_plot_group1_' + feature)
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });

    groupHistogramBar1.append('rect')
          .attr('x', 0)
          .attr('width', xScale.bandwidth())
          .attr('height', (d) => _self.layout.featureTable.corr.height - yScale(d.length))
          .style('fill', gs.groupColor1)
          .style('stroke', 'black')
          .style('opacity', 0.5)
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);

    groupHistogramBar2 = d3.select(svgCorrPlot).selectAll('.g_corr_plot_group2_' + feature)
          .data(dataBinGroup2)
          .enter().append('g')
          .attr('class', 'g_corr_plot_group2_' + feature)
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });

    groupHistogramBar2.append('rect')
          .attr('x', 0)
          .attr('width', xScale.bandwidth())
          .attr('height', (d) => _self.layout.featureTable.corr.height - yScale(d.length))
          .style('fill', gs.groupColor2)
          .style('stroke', 'black')
          .style('opacity', 0.5)
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);

    return (
      <div className={styles.corrPlotWrapper}>
        {svgCorrPlot.toReact()}
      </div>
    );
  }

  renderCorrPlotWithSensitiveAttr(feature) {
    const _self = this;

    const { rankingInstance } = this.props,
          { instances } = rankingInstance;

    const dataGroup1 = _.chain(instances)
              .filter((d) => d.group === 0)
              .map((d) => d.features[feature])
              .value(),
          dataGroup2 = _.chain(instances)
              .filter((d) => d.group === 1)
              .map((d) => d.features[feature])
              .value(),
          featureValues = _.map(instances, (d) => d.features[feature]),
          min = d3.min(featureValues),
          max = d3.max(featureValues),
          step = Math.floor((max-min)/10),
          thresholds = d3.range(min, max, step);
    
    const dataBin = d3.histogram()
                  .domain(d3.extent(featureValues))
                  .thresholds(thresholds)
                  (featureValues),
          dataBinGroup1 = d3.histogram()
                  .domain(d3.extent(featureValues))
                  .thresholds(thresholds)
                  (dataGroup1),
          dataBinGroup2 = d3.histogram()
                  .domain(d3.extent(featureValues))
                  .thresholds(thresholds)
                  (dataGroup2);

    const svgCorrPlot = new ReactFauxDOM.Element('svg');

    svgCorrPlot.setAttribute('width', _self.layout.featureTable.corr.width);
    svgCorrPlot.setAttribute('height', _self.layout.featureTable.corr.height);
    svgCorrPlot.setAttribute('0 0 100 100');
    svgCorrPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgCorrPlot.setAttribute('class', 'svg_corr_plot_' + feature);

    // Both groups share the same x and y scale
    const xScale = d3.scaleBand()
                  .domain(dataBin.map((d) => d.x0))
                  .range([0, _self.layout.featureTable.corr.width]),
          yScale = d3.scaleLinear()
                  .domain(d3.extent(dataBin, (d) => d.length))
                  .range([_self.layout.featureTable.corr.height, 0]);
          // xAxis = d3.select(svg)
          //     .append('g')
          //     .attr('transform', 'translate(0,0)')
          //     .call(d3.axisBottom(xScale).tickSize(0).tickFormat(''));

    let groupHistogramBar1, groupHistogramBar2;

    groupHistogramBar1 = d3.select(svgCorrPlot).selectAll('.g_corr_plot_group1_' + feature)
          .data(dataBinGroup1)
          .enter().append('g')
          .attr('class', 'g_corr_plot_group1_' + feature)
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });

    groupHistogramBar1.append('rect')
          .attr('x', 0)
          .attr('width', xScale.bandwidth())
          .attr('height', (d) => _self.layout.featureTable.corr.height - yScale(d.length))
          .style('fill', gs.groupColor1)
          .style('stroke', 'black')
          .style('opacity', 0.5)
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);

    groupHistogramBar2 = d3.select(svgCorrPlot).selectAll('.g_corr_plot_group2_' + feature)
          .data(dataBinGroup2)
          .enter().append('g')
          .attr('class', 'g_corr_plot_group2_' + feature)
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });

    groupHistogramBar2.append('rect')
          .attr('x', 0)
          .attr('width', xScale.bandwidth())
          .attr('height', (d) => _self.layout.featureTable.corr.height - yScale(d.length))
          .style('fill', gs.groupColor2)
          .style('stroke', 'black')
          .style('opacity', 0.5)
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);

    return (
      <div className={styles.corrPlotWrapper}>
        {svgCorrPlot.toReact()}
      </div>
    );
  }

  renderMethods() {
    const { methods } = this.props;

    return methods.map((method, idx) => 
        (<DropdownItem 
          key={idx}
          value={method.name}
          onClick={this.handleClickMethod}>
          {method.name}
        </DropdownItem>));
  }

  onTopkChange = (value) => {
    this.setState({
      topkInput: value
    });
  }

  render() {
    const { rankingInstance } = this.props,
          { features, sensitiveAttr, target, method } = rankingInstance;

    const featureNames = features.map((feature) => feature.name),
          targetName = target.name,
          sensitiveAttrName = sensitiveAttr.name,
          methodName = method.name;

    const columns = [
      { title: 'Feature', dataIndex: 'feature', key: 1, width: 100 },
      { title: 'Dist', dataIndex: 'dist', key: 2 },
      { title: 'Corr', dataIndex: 'corr', key: 3 }
    ];
    const dataFeatureTable = this.renderFeatureSelectionsForTable();

    // rowSelection object indicates the need for row selection
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
      },
      getCheckboxProps: record => ({
        disabled: record.name === 'Disabled User', // Column configuration not to be checked
        name: record.name,
      }),
    };

    return (
      <div className={styles.Generator}>
        <div className={styles.generatorTitleWrapper}>
          <span className={styles.generatorTitle + ' ' + index.title}>Generator</span>
          <br />
        </div>
        {/* // Sensitive Attribute selector */}
        <div className={styles.selectSensitiveAttr}>Sensitive attribute</div>
        <Dropdown className={styles.sensitiveAttrDropdown} 
                  isOpen={this.state.sensitiveAttrDropdownOpen} 
                  toggle={this.toggleSensitiveAttrDropdown}>
          <DropdownToggle className={styles.sensitiveAttrDropdownToggle} caret>
            {sensitiveAttrName}
          </DropdownToggle>
          <DropdownMenu>
            {this.renderSensitiveAttrSelections()}
          </DropdownMenu>
        </Dropdown>
        {/* // Protected Group selector */}
        { typeof(this.props.rankingInstance.sensitiveAttr) === 'undefined' ? <div></div> : this.renderSelectProtectedGroup() }
        {/* // Feature selector */}
        <div className={styles.selectFeatures}>Features</div>
        <TreeSelect
          className={styles.featureSelector}
          showSearch
          style={{ width: 330 }}
          value={featureNames}
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          placeholder='Please select'
          allowClear
          multiple
          treeDefaultExpandAll
          onChange={this.handleSelectFeatures} >
          {this.renderFeatureSelections()}
        </TreeSelect>
        <Table 
          rowSelection={rowSelection}
          columns={columns} 
          dataSource={dataFeatureTable} 
          scroll={{ y: 200 }}
          pagination={false}
          onRow={(record) => {
            return {
              onSelect: this.handleSelectFeatures
            };
          }}
        />
        {/* // Target variable selector */}
        <div className={styles.selectSensitiveAttr}>Target variable</div>
        <Dropdown className={styles.targetDropdown} 
                  isOpen={this.state.targetDropdownOpen} 
                  toggle={this.toggleTargetDropdown}>
          <DropdownToggle className={styles.targetDropdownToggle} caret>
            {targetName}
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
            {methodName}
          </DropdownToggle>
          <DropdownMenu>
            {this.renderMethods()}
          </DropdownMenu>
        </Dropdown>
        <div className={styles.runButtonWrapper}>
          <Button className={styles.buttonGenerateRanking} color='danger' onClick={this.handleClickRun}>RUN</Button>
        </div>
      </div>
    );
  }
}

export default Generator;
