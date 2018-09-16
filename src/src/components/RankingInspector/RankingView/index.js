import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Slider, Icon, InputNumber } from 'antd';
import dc from 'dc';
import crossfilter from 'crossfilter';

import WholeRankingChart from './wholeRankingChart';

import styles from './styles.scss';
import index from '../../../index.css';
import gs from '../../../config/_variables.scss'; // gs (=global style)

class RankingView extends Component {
    constructor(props) {
      super(props);
    
      this.groupColorScale;
      this.layout = {
          svgRanking: {
              width: 800,
              height: 80
          },
          topkRankingView: {
            width: 350,
            height: 60,
            margin: 10,
            bw: 7 // bar width
          },
          selectedIntervalView: {
            width: 350,
            height: 40,
            margin: 10,
            bw: 7 // bar width
          },
          wholeRankingChart: {
            width: 700,
            height: 30
          }
      };

      this.handleSelectedRankingInterval = this.handleSelectedRankingInterval.bind(this);
      this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
    }

    handleSelectedRankingInterval(interval) {
      console.log(interval);
      this.props.onSelectedRankingInterval(interval);
    }

    handleSelectedTopk(topk) {
      this.props.onSelectedTopk(topk);
    }

    render() {
      if ((!this.props.topk || this.props.topk.length === 0) ||
          (!this.props.selectedRankingInterval || this.props.selectedRankingInterval.length === 0) ||
          (!this.props.data || this.props.data.length === 0)) {
        return <div />
      }

      const _self = this;

      const intervalIdx = this.props.selectedRankingInterval,
            intervalFrom = intervalIdx.from,
            intervalTo = intervalIdx.to,
            data = this.props.data,
            instances = _.sortBy([...data.instances], ['score'], ['desc']).reverse(),
            topk = this.props.topk;
      
      // Split the data into Topk and the rest
      const dataTopk = instances.slice(0, topk),
            dataSelectedInterval = instances.slice(intervalFrom, intervalTo + 1);
      
      // Set up the layout
      const svgTopkRankingView = new ReactFauxDOM.Element('svg'),
            svgSelectedIntervalView = new ReactFauxDOM.Element('svg');

      svgTopkRankingView.setAttribute('width', _self.layout.topkRankingView.width);
      svgTopkRankingView.setAttribute('height', _self.layout.topkRankingView.height);
      svgTopkRankingView.setAttribute('class', 'svg_top_ranking');

      svgSelectedIntervalView.setAttribute('width', _self.layout.selectedIntervalView.width);
      svgSelectedIntervalView.setAttribute('height', _self.layout.selectedIntervalView.height);
      svgSelectedIntervalView.setAttribute('class', 'svg_selected_interval');

      const xTopkRankingScale = d3.scaleBand()
              .domain(_.map(dataTopk, (d) => d.ranking))
              .range([0, _self.layout.topkRankingView.bw * topk]),
            yTopkScoreScale = d3.scaleLinear()
              .domain([0, 100])
              .range([0, _self.layout.topkRankingView.height - _self.layout.topkRankingView.margin*2]),
            xSelectedIntervalScale = d3.scaleBand()
              .domain(_.map(dataSelectedInterval, (d) => d.ranking))
              .range([0, _self.layout.topkRankingView.bw * (intervalTo - intervalFrom + 1)]),
            ySelectedIntervalScoreScale = d3.scaleLinear()
              .domain(d3.extent(data, (d) => d.score))
              .range([0, _self.layout.selectedIntervalView.height]),
            groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([1, 2]);

      const gTopkRanking = d3.select(svgTopkRankingView).append('g')
              .attr('class', 'g_top_k_ranking')
              .attr('transform', 'translate(' + _self.layout.topkRankingView.margin + ',' + '0)'),
            gSelectedInterval = d3.select(svgSelectedIntervalView).append('g')
              .attr('class', 'g_selected_interval')
              .attr('transform', 'translate(' + _self.layout.selectedIntervalView.margin + ',' + '0)');

      gTopkRanking.selectAll('.rect_topk')
          .data(dataTopk)
          .enter().append('rect')
          .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
          .attr('x', (d) => xTopkRankingScale(d.ranking))
          .attr('y', (d) => _self.layout.topkRankingView.height - yTopkScoreScale(d.score))
          .attr('width', _self.layout.topkRankingView.bw)
          .attr('height', (d) => yTopkScoreScale(d.score))
          .style('fill', (d) => groupColorScale(d.group))
          .style('stroke', 'white')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 1.5);

      return (
        <div className={styles.RankingView}>
          <div className={styles.rankingViewTitleWrapper}>
            <Icon className={styles.step4} type="check-circle" theme="filled" /> &nbsp;
            <div className={styles.rankingViewTitle + ' ' + index.title}>Output</div>
          </div>
          <div className={styles.outputSummary}>
            <div className={index.subTitle}>Summary</div>
            <div>Accuracy: {this.props.data.stat.accuracy}</div>
          </div>
          <div className={styles.topkRankingView}>
            <div>Top-k ranking</div>
            {svgTopkRankingView.toReact()}
          </div>
          <div className={styles.selectedRankingView}>
            <div>Selected ranking</div>
            {svgTopkRankingView.toReact()}
          </div>
          <div className={styles.sliderName}>
            <div>Interval</div>
            <div>Top-k</div>
          </div>
          <div className={styles.rankingSliderWrapper}>
            <div className={styles.wholeRankingChartWrapper}>
              <InputNumber
                size='small'
                min={1}
                max={this.props.n}
                style={{ width: 40 }}
                value={this.props.selectedRankingInterval.from}
                onChange={this.onTopkChange}
              />
              <span>&nbsp;-&nbsp;</span>
              <InputNumber
                size='small'
                min={1}
                max={this.props.n}
                style={{ width: 40 }}
                value={this.props.selectedRankingInterval.to}
                onChange={this.onTopkChange}
              />
              <WholeRankingChart
                data={this.props.data}
                width={700} height={30} margin={10}
                onSelectedRankingInterval={this.props.handleSelectedRankingInterval}
              />
            </div>
            <div className={styles.topkSliderWrapper}>
              {/* <InputNumber
                size='small'
                min={1}
                max={this.props.n}
                style={{ width: 40 }}
                value={this.props.topk}
                onChange={this.onTopkChange}
              /> */}
              <Slider 
                step={1} 
                min={1}
                max={this.props.n}
                defaultValue={30} 
                onChange={this.handleSelectedTopk} 
              />
            </div>
          </div>
        </div>
      );
    }
  }

  export default RankingView;