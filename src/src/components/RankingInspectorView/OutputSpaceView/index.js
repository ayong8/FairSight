import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Slider, Icon, InputNumber, Tag } from 'antd';

import styles from './styles.scss';
import index from '../../../index.css';
import gs from '../../../config/_variables.scss'; // gs (=global style)

class OutputSpaceView extends Component {
    constructor(props) {
      super(props);
    
      this.groupColorScale;
      this.layout = {
          svg: {
            width: 80,
            height: 800,
            margin: 10
          },
          plot: {
            marginLeft: 100,
            marginTop: 10
          }
      };
    }

    componentWillUpdate() {
      if (!this.props.selectedInstance || Object.keys(this.props.selectedInstance).length !== 0) {
        // d3.selectAll('.rect_whole_ranking_topk_' + this.props.selectedInstance.features.idx)
        //   .style('stroke-width', 2);
      }
    }

    render() {
      console.log('OutputSpaceView rendered');
      const _self = this;

      const { mode, data, topk, selectedRankingInterval } = this.props,
            { instances } = data,
            { from, to } = selectedRankingInterval,
            selectedInstances = instances.slice(from, to);
      
      // Set up the layout
      const svg = new ReactFauxDOM.Element('svg');

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', _self.layout.svg.height);
      svg.setAttribute('class', 'svg_output_space');
      // svg.style.setProperty('border', '1px solid #d9d9d9');
      // svg.style.setProperty('backgroundColor', '#fbfbfb');

      const rectInterval = 7,
            topkPlotHeight = rectInterval * topk,
            selectedNonTopkPlotHeight = rectInterval * (to - topk + 1);
      const rankingScale = d3.scaleBand()
              .domain(_.map(selectedInstances, (d) => d.ranking))
              .range([0, rectInterval * to]),
            topkRankingScale = d3.scaleBand()
              .domain(d3.range(1, topk+1))
              .range([0, topkPlotHeight]),
            selectedNonTopkRankingScale = d3.scaleBand()
              .domain(d3.range(topk+1, to+1))
              .range([0, selectedNonTopkPlotHeight]),
            groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([0, 1]);

      const topkTickValues = [1, ...d3.range(5, topk, 5), topk],
            selectedNonTopkTickValues = [topk+1, ...d3.range(topk+1 + ((topk+1) % 5), to, 5), to];

      const xTopkAxis = d3.select(svg)
              .append('g')
              .attr('class', 'g_x_output_space_topk_axis')
              .attr('transform', 'translate(' + _self.layout.plot.marginLeft + ',' + (_self.layout.plot.marginTop) + ')')
              .call(d3.axisLeft(topkRankingScale).tickValues(topkTickValues).tickSizeOuter(0)),
            xSelectedNonTopkAxis = d3.select(svg)
              .append('g')
              .attr('class', 'g_x_output_space_selected_non_topk_axis')
              .attr('transform', 'translate(' + (_self.layout.plot.marginLeft) + ',' + (_self.layout.plot.marginTop + topkPlotHeight) + ')')
              .call(d3.axisLeft(selectedNonTopkRankingScale).tickSizeOuter(0).tickValues(d3.range(topk+1, to, 5)));

      const gTopkRanking = d3.select(svg).append('g')
              .attr('class', 'g_top_k_ranking')
              .attr('transform', 'translate(' + (130) + ',' + '10)');

      const diagonalPattern = d3.select(svg)
              .append('defs')
              .append('pattern')
                .attr('id', 'diagonalHatch')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 4)
                .attr('height', 4)
              .append('path')
                .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
                .attr('stroke', '#000000')
                .attr('stroke-width', 1);

      const topkRect = gTopkRanking.selectAll('.rect_topk')
              .data(selectedInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
              .attr('x', (d) => 0)
              .attr('y', (d) => rankingScale(d.ranking))
              .attr('width', 30)
              .attr('height', (d) => rectInterval - 2)
              .style('fill', (d) => (mode === 'GF') ? groupColorScale(d.group) : 
                                    (mode === 'IF') ? gs.individualColor : 'none')
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .on('mouseover', function(d) {
                d3.select(this).style('stroke', 'black');
                _self.props.onSelectedInstance(d);
              });

      const topkRectForPattern = gTopkRanking.selectAll('.rect_topk_for_pattern')
              .data(selectedInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_topk_for_pattern rect_topk_for_pattern_' + d.ranking)
              .attr('x', (d) => 0)
              .attr('y', (d) => rankingScale(d.ranking))
              .attr('width', 30)
              .attr('height', (d) => rectInterval - 2)
              .style('fill', (d) => !d.target ? 'url(#diagonalHatch)': 'none')
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .on('mouseover', (d) => {
                this.props.onSelectedInstance(d);
              });

      return (
        <div className={styles.OutputSpaceView}>
          {/* <div className={styles.rankingViewTitle + ' ' + index.subTitle}>
            Output space &nbsp;
          </div> */}
          {svg.toReact()}
        </div>
      );
    }
  }

  export default OutputSpaceView;