import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Button } from 'reactstrap';
import { Slider, Icon, InputNumber, Tag } from 'antd';
import dc from 'dc';
import crossfilter from 'crossfilter';

import UtilityView from '../UtilityView';
import WholeRankingChart from './wholeRankingChart';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class RankingView extends Component {
    constructor(props) {
      super(props);
    
      this.groupColorScale;
      this.intervalTo;
      this.layout = {
          svgRanking: {
              width: 800,
              height: 80
          },
          topkRankingView: {
            width: 450,
            height: 60,
            margin: 10,
            bw: 7 // bar width
          },
          selectedIntervalView: {
            width: 450,
            height: 40,
            margin: 10,
            bw: 7 // bar width
          },
          wholeRankingChart: {
            width: 700,
            height: 30
          }
      };

      this.state = {
        topk: 30,
        selectedRankingInterval: {
          from: 0,
          to: 50
        }
      }

      this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
      this.handleIntervalChange = this.handleIntervalChange.bind(this);
      this.handleFilterRunning = this.handleFilterRunning.bind(this);
    }

    handleSelectedTopk(topk) {
      this.setState({
        topk: topk
      });
    }

    handleIntervalChange(intervalTo) {
      this.setState({
        selectedRankingInterval: {
          from: 0,
          to: intervalTo
        }
      });
    }

    handleFilterRunning() {
      const { topk, selectedRankingInterval } = this.state,
            { from, to } = selectedRankingInterval;

      this.props.onSelectedTopk(topk); // Send up the state 'topk' to state
      this.props.onSelectedInterval(to);
      this.props.onRunningFilter();
    }

    render() {
      console.log('RankingView rendered');
      if ((!this.props.data || this.props.data.length === 0)) {
        return <div />
      }

      const _self = this;

      const { data } = this.props,
            { stat } = data,
            { accuracy, goodnessOfFairness, groupSkew, sp, cp } = stat,
            instances = _.sortBy([...data.instances], ['score'], ['desc']).reverse(),
            topk = this.props.topk;
            
      
      // // Split the data into Topk and the rest
      // const dataTopk = instances.slice(0, topk),
      //       dataSelectedInterval = instances.slice(intervalFrom, intervalTo + 1);
      
      // // Set up the layout
      // const svgTopkRankingView = new ReactFauxDOM.Element('svg'),
      //       svgSelectedIntervalView = new ReactFauxDOM.Element('svg');

      // svgTopkRankingView.setAttribute('width', _self.layout.topkRankingView.width);
      // svgTopkRankingView.setAttribute('height', _self.layout.topkRankingView.height);
      // svgTopkRankingView.setAttribute('class', 'svg_top_ranking');

      // svgSelectedIntervalView.setAttribute('width', _self.layout.selectedIntervalView.width);
      // svgSelectedIntervalView.setAttribute('height', _self.layout.selectedIntervalView.height);
      // svgSelectedIntervalView.setAttribute('class', 'svg_selected_interval');

      // const xTopkRankingScale = d3.scaleBand()
      //         .domain(_.map(dataTopk, (d) => d.ranking))
      //         .range([0, (_self.layout.topkRankingView.bw + 2) * topk]),
      //       yTopkScoreScale = d3.scaleLinear()
      //         .domain(d3.extent(dataTopk, (d) => d.score))
      //         .range([_self.layout.topkRankingView.height - _self.layout.topkRankingView.margin, 10]),
      //       xSelectedIntervalScale = d3.scaleBand()
      //         .domain(_.map(dataSelectedInterval, (d) => d.ranking))
      //         .range([0, _self.layout.topkRankingView.bw * (intervalTo - intervalFrom + 1)]),
      //       ySelectedIntervalScoreScale = d3.scaleLinear()
      //         .domain(d3.extent(data, (d) => d.score))
      //         .range([0, _self.layout.selectedIntervalView.height]),
      //       groupColorScale = d3.scaleOrdinal()
      //         .range([gs.groupColor1, gs.groupColor2])
      //         .domain([1, 2]);

      // const xTopkAxisSetting = d3.axisBottom(xTopkRankingScale).tickSize(0).ticks(3),
      //       yTopkAxisSetting = d3.axisLeft(yTopkScoreScale).tickSize(0).ticks(3);

      // const gTopkRanking = d3.select(svgTopkRankingView).append('g')
      //         .attr('class', 'g_top_k_ranking')
      //         .attr('transform', 'translate(' + _self.layout.topkRankingView.margin + ',' + '0)'),
      //       gSelectedInterval = d3.select(svgSelectedIntervalView).append('g')
      //         .attr('class', 'g_selected_interval')
      //         .attr('transform', 'translate(' + _self.layout.selectedIntervalView.margin + ',' + '0)'),
      //       gTopkXAxis = d3.select(svgTopkRankingView).append('g')
      //         .attr('class', 'topk_x_axis')
      //         .attr('transform', 'translate(' + + _self.layout.topkRankingView.margin + ',' + (_self.layout.topkRankingView.height - _self.layout.topkRankingView.margin) + ')'),
      //       gTopkYAxis = d3.select(svgTopkRankingView).append('g')
      //         .attr('class', 'topk_y_axis')
      //         .attr('transform', 'translate(' + _self.layout.topkRankingView.margin + ',0)');

      // gTopkRanking.selectAll('.rect_topk')
      //     .data(dataTopk)
      //     .enter().append('rect')
      //     .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
      //     .attr('x', (d) => xTopkRankingScale(d.ranking))
      //     .attr('y', (d) => yTopkScoreScale(d.score))
      //     .attr('width', _self.layout.topkRankingView.bw)
      //     .attr('height', (d) => _self.layout.topkRankingView.height - _self.layout.topkRankingView.margin - yTopkScoreScale(d.score))
      //     .style('fill', (d) => groupColorScale(d.group))
      //     .style('stroke', 'black')
      //     .style('shape-rendering', 'crispEdge')
      //     .style('stroke-width', 0.5);

      // const xAxisTopk = gTopkXAxis
      //         .call(xTopkAxisSetting)
      //         .selectAll('text')
      //         .attr('class', 'x_topk_label')
      //         .style('font-size', '9px')
      //         .style('text-anchor','middle');

      return (
        <div className={styles.RankingView}>
          <div className={styles.rankingViewTitle + ' ' + index.title}>
            Current ranking: &nbsp;
            <Tag color="#108ee9">{'R' + data.rankingId}</Tag>
          </div>
          <div className={styles.summaryViewTitle + ' ' + index.subTitle}>Summary</div>
          <div className={styles.summaryView}>
            <div className={styles.accuracyWrapper}>
              <div className={styles.accuracyTitle}>Accuracy</div>
              <div className={styles.accuracy}>{accuracy + '%'}</div>
            </div>
            <div className={styles.groupFairnessWrapper}>
              <div className={styles.groupFairnessTitle}>Statistical Parity</div>
              <div className={styles.groupFairness}>{sp}</div>
              <div className={styles.groupFairnessTitle}>Conditional Parity</div>
              <div className={styles.groupFairness}>{cp}</div>
            </div>
            <div className={styles.individualFairnessWrapper}>
              <div className={styles.individualFairnessTitle}>Goodness</div>
              <div className={styles.individualFairness}>{goodnessOfFairness}</div>
              <div className={styles.individualFairnessTitle}>Group skew</div>
              <div className={styles.individualFairness}>{groupSkew}</div>
            </div>
          </div>
          <div className={styles.filterViewTitle  + ' ' + index.subTitle}>
            <Icon type="filter" theme="outlined" />
            &nbsp;Filter
          </div>
          <div className={styles.topkFilterView}>
            <div className={styles.topkInputWrapper}>
              <div className={styles.topkFilterTitle}>Top-k</div>
              &nbsp;&nbsp;
              <InputNumber
                className={styles.topkInput}
                size='small'
                min={1}
                max={this.props.n}
                style={{ width: 40 }}
                value={this.state.topk}
                onChange={this.handleSelectedTopk}
              />
            </div>
            <div className={styles.topkSliderWrapper}>
              <Slider 
                className={styles.topkSlider}
                step={1} 
                min={1}
                max={this.props.n}
                value={this.state.topk}
                style={{ width: 450 }}
                onChange={this.handleSelectedTopk} 
              />
            </div>
          </div>
          <UtilityView 
              className={styles.UtilityView}
              n={this.props.n}
              rankingInstance={this.props.data}
              topk={this.props.topk} />
          <div className={styles.intervalFilterView}>            
            <div className={styles.intervalInputWrapper}>
              <div className={styles.intervalFilterTitle}>Interval</div>
              <div>
                <InputNumber
                  size='small'
                  min={1}
                  max={this.props.n}
                  style={{ width: 40 }}
                  value={1}
                />
                <span>&nbsp;-&nbsp;</span>
                <InputNumber
                  size='small'
                  min={1}
                  max={this.props.n}
                  style={{ width: 40 }}
                  value={this.state.selectedRankingInterval.to}
                  onChange={this.handleIntervalChange}
                />
              </div>
            </div>
            <Slider 
              className={styles.intervalSlider}
              step={1} 
              min={1}
              max={this.props.n}
              value={this.state.selectedRankingInterval.to}
              style={{ width: 450 }}
              onChange={this.handleIntervalChange}
            />
            <div className={styles.runButtonWrapper}>
              <Button 
                className={styles.buttonGenerateRanking} 
                color='danger' 
                onClick={this.handleFilterRunning}>RUN</Button>
            </div>
          </div>
        </div>
      );
    }
  }

  export default RankingView;