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
            height: 350,
            margin: 10
          }
      };
    }

    render() {
      console.log('OutputSpaceView rendered');
      const _self = this;

      const { mode, data, topk, selectedInstances } = this.props,
            { instances } = data,
            to = selectedInstances.length;
      
      // Set up the layout
      const svg = new ReactFauxDOM.Element('svg');

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', _self.layout.svg.height);
      svg.setAttribute('class', 'svg_top_ranking');
      svg.style.setProperty('border', '1px solid #d9d9d9');
      svg.style.setProperty('backgroundColor', '#fbfbfb');

      const rectInterval = 7;
      const rankingScale = d3.scaleBand()
              .domain(_.map(selectedInstances, (d) => d.ranking))
              .range([0, rectInterval * to]),
            groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([0, 1]);

      const gAxis = d3.select(svg).append('g')
            .attr('class', 'g_y_ranking_axis')
            .attr('transform', 'translate(' + 100 + ',' + 10 + ')')
            .call(d3.axisLeft(rankingScale).tickValues(d3.range(1, topk, 5)));

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
              .style('stroke-width', 0.5);

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
              .style('stroke-width', 0.5);

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