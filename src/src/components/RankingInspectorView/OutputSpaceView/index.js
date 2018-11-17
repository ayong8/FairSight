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

      const gTopkRanking = d3.select(svg).append('g')
              .attr('class', 'g_top_k_ranking')
              .attr('transform', 'translate(' + (130) + ',' + '10)');

      gTopkRanking.selectAll('.rect_topk')
          .data(selectedInstances)
          .enter().append('rect')
          .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
          .attr('x', (d) => 0)
          .attr('y', (d) => rankingScale(d.ranking))
          .attr('width', 30)
          .attr('height', (d) => rectInterval - 2)
          .style('fill', (d) => (mode === 'GF') ? groupColorScale(d.group) : 
                                (mode === 'IF' && d.topk) ? gs.topkColor : gs.nonTopkColor)
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);

      return (
        <div className={styles.OutputSpaceView}>
          <div className={styles.rankingViewTitle + ' ' + index.subTitle}>
            Output space &nbsp;
          </div>
          {svg.toReact()}
        </div>
      );
    }
  }

  export default OutputSpaceView;