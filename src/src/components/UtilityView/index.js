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
        width: 500,
        height: 80,
        margin: 10,
        marginLeft: 15,
        svg: {
          width: 450,
          height: 60
        }
      }
    }
  
    render() {
      const { rankingInstance, n, topk } = this.props;
      let sampleData = [
            { topK: 10,  statParity: 0, conditionalParity: 0 },
            { topK: 15,  statParity: 0.5, conditionalParity: -0.3 },
            { topK: 20,  statParity: -0.8, conditionalParity: 0.4 },
            { topK: 25,  statParity: -0.6, conditionalParity: -0.7 },
            { topK: 30,  statParity: 0, conditionalParity: 0.6 },
            { topK: 35,  statParity: 1.2, conditionalParity: 1.1 }
          ],
          gPlot,
          xTopKScale, yLogScoreScale,
          xAxisSetting, yAxisSetting, xAxis, yAxis,
          statParityDots, statParityLine, statParityPath,
          conditionalParityDots, conditionalParityLine, conditionalParityPath;

      this.svg = new ReactFauxDOM.Element('svg');

      this.svg.setAttribute('width', this.layout.svg.width);
      this.svg.setAttribute('height', this.layout.svg.height);
      this.svg.setAttribute('0 0 100 100');
      this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      gPlot = d3.select(this.svg).append('g')
          .attr('transform', 'translate(' + this.layout.marginLeft + ',0)');

      xTopKScale = d3.scaleLinear()
          .domain([1, n])
          .range([0, this.layout.svg.width-this.layout.margin]);

      yLogScoreScale = d3.scaleLinear()
          .domain([-2, 2])
          .range([(this.layout.svg.height-this.layout.margin), this.layout.margin]);

      xAxisSetting = d3.axisBottom(xTopKScale).tickSize(0).ticks(5);
      yAxisSetting = d3.axisLeft(yLogScoreScale).tickSize(0).ticks(5);

      xAxis = d3.select(this.svg).append('g')
          .call(xAxisSetting)
          .attr('class', 'xAxis')
          .attr('transform', 'translate(' + this.layout.marginLeft + ',' + (this.layout.svg.height-this.layout.margin) + ')');

      yAxis = d3.select(this.svg).append('g')
          .call(yAxisSetting)
          .attr('class', 'yAxis')
          .attr('transform', 'translate('+ this.layout.marginLeft + ',0)');

      statParityLine = d3.line()
          .x((d) => xTopKScale(d.topK))
          .y((d) => yLogScoreScale(d.statParity));

      statParityPath = gPlot.append('path')
          .datum(sampleData)
          .style('fill', 'none')
          .style('stroke', d3.rgb('lightblue').darker())
          .style('stroke-width', 1)
          .attr('d', statParityLine);

      statParityDots = gPlot.selectAll('.statParitydot')
          .data(sampleData)
          .enter().append('circle')
          .attr('class', 'statParitydot')
          .attr('cx', (d) => xTopKScale(d.topK))
          .attr('cy', (d) => yLogScoreScale(d.statParity))
          .attr('r', 2)
          .style('fill', 'lightblue')
          .style('stroke', d3.rgb('lightblue').darker());

      conditionalParityLine = d3.line()
          .x((d) => xTopKScale(d.topK))
          .y((d) => yLogScoreScale(d.conditionalParity));

      conditionalParityPath = gPlot.append('path')
          .datum(sampleData)
          .style('fill', 'none')
          .style('stroke', d3.rgb('mediumpurple').darker())
          .style('stroke-width', 1)
          .attr('d', conditionalParityLine);

      conditionalParityDots = gPlot.selectAll('.conditionalParitydot')
          .data(sampleData)
          .enter().append('circle')
          .attr('class', 'conditionalParitydot')
          .attr('cx', (d) => xTopKScale(d.topK))
          .attr('cy', (d) => yLogScoreScale(d.conditionalParity))
          .attr('r', 2)
          .style('fill', 'mediumpurple')
          .style('stroke', d3.rgb('mediumpurple').darker());

      return (
        <div className={styles.UtilityView}>
          <div>Utility</div>
          {/* <div>(Statistical parity, Conditional parity)</div> */}
          {this.svg.toReact()}
        </div>
      );
    }
  }

  export default UtilityView;