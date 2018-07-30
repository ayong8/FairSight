import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class UtilityView extends Component {
    constructor(props) {
      super(props);
      this.svg;
      this.layout = {
        width: 100,
        height: 100,
        svg: {
          width: 200,
          height: 200
        }
      }
    }
  
    render() {
      let sampleData = [
            { topK: 10,  statParity: 0},
            { topK: 15,  statParity: 0.5},
            { topK: 20,  statParity: -0.8},
            { topK: 25,  statParity: -0.6},
            { topK: 30,  statParity: 0},
            { topK: 35,  statParity: 1.2}
          ],
          gPlot,
          xTopKScale, yLogScoreScale,
          xAxisSetting, yAxisSetting, xAxis, yAxis,
          statParityDots, statParityLine;

      this.svg = new ReactFauxDOM.Element('svg');

      this.svg.setAttribute('width', this.layout.svg.width);
      this.svg.setAttribute('height', this.layout.svg.height);
      this.svg.setAttribute('0 0 100 100');
      this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svg.style.setProperty('margin', '0 5%');

      gPlot = d3.select(this.svg).append('g')
          .attr('transform', 'translate(0,0)');

      xTopKScale = d3.scaleLinear()
          .domain([10, 40])
          .range([0, 180]);

      yLogScoreScale = d3.scaleLinear()
          .domain([-2, 2])
          .range([180, 0]);

      xAxisSetting = d3.axisBottom(xTopKScale).tickSize(0).ticks(5);
      yAxisSetting = d3.axisLeft(yLogScoreScale).tickSize(0).ticks(5);

      xAxis = gPlot.append('g')
          .call(xAxisSetting)
          .attr('class', 'xAxis')
          .attr('transform', 'translate(0,180)');

      yAxis = gPlot.append('g')
          .call(yAxisSetting)
          .attr('class', 'xAxis')
          .attr('transform', 'translate(0,0)');

      statParityDots = gPlot.selectAll('.statParitydot')
          .data(sampleData)
          .enter().append('circle')
          .attr('class', 'statParitydot')
          .attr('cx', (d) => xTopKScale(d.topK))
          .attr('cy', (d) => yLogScoreScale(d.statParity))
          .attr('r', 2)
          .style('fill', 'lightblue')
          .style('stroke', d3.rgb('lightblue').darker());

      return (
        <div className={styles.UtilityView}>
          <div className={index.title}>Utility</div>
          {this.svg.toReact()}
        </div>
      );
    }
  }

  export default UtilityView;