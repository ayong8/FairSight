import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Icon, InputNumber, Tag } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class CorrelationView extends Component {
    constructor(props) {
      super(props);
    
      this.groupColorScale;
      this.layout = {
          svg: {
            width: 90,
            height: 400,
            margin: 10
          }
      };

      this.state = {
        sortMatrixXdropdownOpen: false,
        sortMatrixYdropdownOpen: false,
        sortMatrixXBy: 'distortion',
        sortMatrixYBy: 'distortion',
        sortMatrixXdropdownValue: 'features',
        sortMatrixYdropdownValue: 'features'
      }

      this.toggleMatrixX = this.toggleMatrixX.bind(this);
      this.toggleMatrixY = this.toggleMatrixY.bind(this);
      this.handleSortingMatrixX = this.handleSortingMatrixX.bind(this);
      this.handleSortingMatrixY = this.handleSortingMatrixY.bind(this);
    }

    toggleMatrixX() {
      this.setState({
        sortMatrixXdropdownOpen: !this.state.sortMatrixXdropdownOpen
      });
    }

    toggleMatrixY() {
      this.setState({
        sortMatrixYdropdownOpen: !this.state.sortMatrixYdropdownOpen
      });
    }

    handleSortingMatrixX(e) {
      let _self = this;

      let sortMatrixXBy = e.target.value,
          { data } = this.props,
          { selectedInstances, selectedPermutationDiffsFlattend } = this.state;

      const sortedX = [...selectedInstances].sort((a, b) => 
                (sortMatrixXBy === 'sumDistortion') ?
                d3.ascending(a.sumDistortion, b.sumDistortion) :
                d3.ascending(a.features[sortMatrixXBy], b.features[sortMatrixXBy])
            );
      
      _self.xMatrixScale.domain(
          _.map(sortedX, (d) => d.idx));
      _self.xAttributeScale.domain(
          d3.extent(selectedInstances, (d) => 
            (sortMatrixXBy === 'sumDistortion') ? 
              d.sumDistortion : 
              d.features[sortMatrixXBy]
          ));

      this.setState({ 
        sortMatrixXBy: e.target.value,
        sortMatrixXdropdownValue: sortMatrixXBy
      });

      // For matrix cells
      d3.selectAll('.g_cell')
          .data(selectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .attr('transform', (d) =>
            'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')'
          );

      // Bottom
      // For Attribute plot on the bottom
      d3.selectAll('.attr_rect_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.idx))
          .attr('fill', (d) => {
              return (sortMatrixXBy === 'sumDistortion') ? 
                _self.xAttributeScale(d.sumDistortion) : 
                _self.xAttributeScale(d.features[sortMatrixXBy])
          });

      d3.selectAll('.pair_rect_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.idx));

      // For sum distortion plot on the bottom
      d3.selectAll('.sum_distortion_rect_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.idx) + _self.cellWidth / 2);

      d3.selectAll('.sum_distortion_circle_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('cx', (d) => _self.xMatrixScale(d.idx) + _self.cellWidth / 2);

      //this.props.onCalculateNDM(this.selectedPermutationDiffs);
    }

    handleSortingMatrixY(e) {
      let _self = this;

      let sortMatrixYBy = e.target.value,
          { data } = this.props,
          { selectedInstances, selectedPermutationDiffsFlattend } = this.state;

      const sortedY = _.sortBy(selectedInstances, 
              (sortMatrixYBy === 'sumDistortion') ? 
                sortMatrixYBy : 
                'features.'+ sortMatrixYBy
            );
      
      _self.yMatrixScale.domain(
          _.map(sortedY, (d) => d.idx ));
      _self.yAttributeScale.domain(
          d3.extent(_.map(selectedInstances, (d) => 
            (sortMatrixYBy === 'sumDistortion') ? 
              d.sumDistortion : 
              d.features[sortMatrixYBy]
          ))
        );

      this.setState({ 
        sortMatrixYBy: e.target.value,
        sortMatrixYdropdownValue: sortMatrixYBy
      });

      d3.selectAll('.g_cell')
          .data(selectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .attr('transform', (d) =>
            'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')'
          );

      // Bottom
      // For Attribute plot on the bottom
      d3.selectAll('.attr_rect_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.idx))
          .attr('fill', (d) => 
            (sortMatrixYBy === 'sumDistortion') ? 
              _self.yAttributeScale(d.sumDistortion) : 
              _self.yAttributeScale(d.features[sortMatrixYBy])
          );

      d3.selectAll('.pair_rect_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.idx));

      // For sum distortion plot on the bottom
      d3.selectAll('.sum_distortion_rect_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.idx) + _self.cellWidth / 2);

      d3.selectAll('.sum_distortion_circle_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('cy', (d) => _self.yMatrixScale(d.idx) + _self.cellWidth / 2);
      
      //this.props.onCalculateNDM(this.selectedPermutationDiffsFlattend);
    }

    renderMatrixXDropdownSelections() {
      const { data } = this.props,
            { features } = data;

      const featureNames = features.map((d) => d.name),
            distortionSelection = 'sumDistortion';
      featureNames.push(distortionSelection);

      return featureNames.map((feature, idx) => 
          (<DropdownItem
              key={idx}
              value={feature} 
              onClick={this.handleSortingMatrixX}>
              {feature}
          </DropdownItem>));
    }

    renderMatrixYDropdownSelections() {
      const { data } = this.props,
            { features } = data;

      const featureNames = features.map((d) => d.name),
            distortionSelection = 'sumDistortion';
      featureNames.push(distortionSelection);

      return featureNames.map((feature, idx) => 
          (<DropdownItem 
              key={idx}
              value={feature} 
              onClick={this.handleSortingMatrixY}>
              {feature}
          </DropdownItem>));
    }

    render() {
      const _self = this;

      // const { data, topk, selectedRankingInterval } = this.props,
      //       { instances } = data,
      //       { from, to } = selectedRankingInterval,
      //       topkInstances = instances.slice(to);
      
      // // Set up the layout
      // const svg = new ReactFauxDOM.Element('svg');

      // svg.setAttribute('width', _self.layout.svg.width);
      // svg.setAttribute('height', _self.layout.svg.height);
      // svg.setAttribute('class', 'svg_top_ranking');

      // const rectHeight = 4;
      // const rankingScale = d3.scaleBand()
      //         .domain(_.map(topkInstances, (d) => d.ranking))
      //         .range([0, rectHeight * to]),
      //       groupColorScale = d3.scaleOrdinal()
      //         .range([gs.groupColor1, gs.groupColor2])
      //         .domain([0, 1]);

      // const gTopkRanking = d3.select(svg).append('g')
      //         .attr('class', 'g_top_k_ranking')
      //         .attr('transform', 'translate(' + _self.layout.svg.margin + ',' + '0)');

      // gTopkRanking.selectAll('.rect_topk')
      //     .data(topkInstances)
      //     .enter().append('rect')
      //     .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
      //     .attr('x', (d) => 0)
      //     .attr('y', (d) => rankingScale(d.ranking))
      //     .attr('width', 15)
      //     .attr('height', (d) => 3)
      //     .style('fill', (d) => groupColorScale(d.group))
      //     // .style('stroke', 'black')
      //     // .style('shape-rendering', 'crispEdge')
      //     // .style('stroke-width', 0.5);

      // // const xTopkRankingScale = d3.scaleBand()
      // //         .domain(_.map(dataTopk, (d) => d.ranking))
      // //         .range([0, (_self.layout.topkRankingView.bw + 2) * topk]),
      // //       yTopkScoreScale = d3.scaleLinear()
      // //         .domain(d3.extent(dataTopk, (d) => d.score))
      // //         .range([_self.layout.topkRankingView.height - _self.layout.topkRankingView.margin, 10]),
      // //       xSelectedIntervalScale = d3.scaleBand()
      // //         .domain(_.map(dataSelectedInterval, (d) => d.ranking))
      // //         .range([0, _self.layout.topkRankingView.bw * (intervalTo - intervalFrom + 1)]),
      // //       ySelectedIntervalScoreScale = d3.scaleLinear()
      // //         .domain(d3.extent(data, (d) => d.score))
      // //         .range([0, _self.layout.selectedIntervalView.height]),
      // //       groupColorScale = d3.scaleOrdinal()
      // //         .range([gs.groupColor1, gs.groupColor2])
      // //         .domain([1, 2]);

      // // const xTopkAxisSetting = d3.axisBottom(xTopkRankingScale).tickSize(0).ticks(3),
      // //       yTopkAxisSetting = d3.axisLeft(yTopkScoreScale).tickSize(0).ticks(3);

      // // const gTopkRanking = d3.select(svgTopkRankingView).append('g')
      // //         .attr('class', 'g_top_k_ranking')
      // //         .attr('transform', 'translate(' + _self.layout.topkRankingView.margin + ',' + '0)'),
      // //       gSelectedInterval = d3.select(svgSelectedIntervalView).append('g')
      // //         .attr('class', 'g_selected_interval')
      // //         .attr('transform', 'translate(' + _self.layout.selectedIntervalView.margin + ',' + '0)'),
      // //       gTopkXAxis = d3.select(svgTopkRankingView).append('g')
      // //         .attr('class', 'topk_x_axis')
      // //         .attr('transform', 'translate(' + + _self.layout.topkRankingView.margin + ',' + (_self.layout.topkRankingView.height - _self.layout.topkRankingView.margin) + ')'),
      // //       gTopkYAxis = d3.select(svgTopkRankingView).append('g')
      // //         .attr('class', 'topk_y_axis')
      // //         .attr('transform', 'translate(' + _self.layout.topkRankingView.margin + ',0)');

      // // gTopkRanking.selectAll('.rect_topk')
      // //     .data(dataTopk)
      // //     .enter().append('rect')
      // //     .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
      // //     .attr('x', (d) => xTopkRankingScale(d.ranking))
      // //     .attr('y', (d) => yTopkScoreScale(d.score))
      // //     .attr('width', _self.layout.topkRankingView.bw)
      // //     .attr('height', (d) => _self.layout.topkRankingView.height - _self.layout.topkRankingView.margin - yTopkScoreScale(d.score))
      // //     .style('fill', (d) => groupColorScale(d.group))
      // //     .style('stroke', 'black')
      // //     .style('shape-rendering', 'crispEdge')
      // //     .style('stroke-width', 0.5);

      // // const xAxisTopk = gTopkXAxis
      // //         .call(xTopkAxisSetting)
      // //         .selectAll('text')
      // //         .attr('class', 'x_topk_label')
      // //         .style('font-size', '9px')
      // //         .style('text-anchor','middle');

      return (
        <div className={styles.CorrelationView}>
          <div className={styles.matrixDropdownWrapper}>
            {/* <span>Set distortion by: &nbsp;</span>
            <CheckboxGroup options={colorOptions} defaultValue={[ 'Absolute' ]} onChange={this.handleSelectGroupCheckbox} /> */}
            <div className={styles.sortMatrixXdropdownWrapper}>
              <span>Sort x axis by: &nbsp;</span>
              <Dropdown className={styles.sortMatrixXdropdown}
                        isOpen={this.state.sortMatrixXdropdownOpen}  
                        size='sm' 
                        toggle={this.toggleMatrixX}>
                <DropdownToggle caret>
                  {this.state.sortMatrixXdropdownValue}
                </DropdownToggle>
                <DropdownMenu>
                  {this.renderMatrixXDropdownSelections()}
                </DropdownMenu>
              </Dropdown>
            </div>
            <div className={styles.sortMatrixYdropdownWrapper}>
              <span>Sort y axis by: &nbsp;</span>
              <Dropdown className={styles.sortMatrixYdropdown}
                        isOpen={this.state.sortMatrixYdropdownOpen}  
                        size='sm' 
                        toggle={this.toggleMatrixY}>
                <DropdownToggle caret>
                  {this.state.sortMatrixYdropdownValue}
                </DropdownToggle>
                <DropdownMenu>
                  {this.renderMatrixYDropdownSelections()}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      );
    }
  }

  export default CorrelationView;