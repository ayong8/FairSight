import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Slider, Icon, InputNumber, Tag } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class TopkRankingView extends Component {
    constructor(props) {
      super(props);
    
      this.groupColorScale;
      this.layout = {
          svg: {
            width: 80,
            height: 500,
            margin: 10
          }
      };
    }

    render() {
      const _self = this;

      const { data, topk, selectedRankingInterval } = this.props,
            { instances } = data,
            { from, to } = selectedRankingInterval,
            topkInstances = instances.slice(from, to);
      
      // Set up the layout
      const svg = new ReactFauxDOM.Element('svg');

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', _self.layout.svg.height);
      svg.setAttribute('class', 'svg_top_ranking');

      const rectInterval = 7;
      const rankingScale = d3.scaleBand()
              .domain(_.map(topkInstances, (d) => d.ranking))
              .range([0, rectInterval * to]),
            groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([0, 1]);

      const gTopkRanking = d3.select(svg).append('g')
              .attr('class', 'g_top_k_ranking')
              .attr('transform', 'translate(' + (130) + ',' + '0)');

      gTopkRanking.selectAll('.rect_topk')
          .data(topkInstances)
          .enter().append('rect')
          .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
          .attr('x', (d) => 0)
          .attr('y', (d) => rankingScale(d.ranking))
          .attr('width', 30)
          .attr('height', (d) => rectInterval - 2)
          .style('fill', (d) => groupColorScale(d.group))
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);

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
        <div className={styles.TopkRankingView}>
          <div className={styles.rankingViewTitle + ' ' + index.subTitle}>
            Ranking &nbsp;
          </div>
          {svg.toReact()}
        </div>
      );
    }
  }

  export default TopkRankingView;