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
class GroupFairnessView extends Component {
    render() {
      const wholeRankingData = this.props.wholeRanking;
            // groupData1 = _.filter(wholeRankingData, (d) => d.group === 1),
            // groupData2 = _.filter(wholeRankingData, (d) => d.group === 2);
  
      // with random sample data
      const groupData1 = d3.range(30).map(d3.randomNormal(70, 15)), // Generate a 1000 data points using normal distribution with mean=20, deviation=5
            groupData2 = d3.range(30).map(d3.randomNormal(60, 10));
  
      // Set up the layout
      const svg = new ReactFauxDOM.Element('svg');
  
      svg.setAttribute('width', '100px');
      svg.setAttribute('height', '100px');
      svg.setAttribute('0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  
      // Both groups share the same x and y scale
      const xScale = d3.scaleLinear()
                  .range([0, 100])
                  .domain([0, 100]);
      
      const yScale = d3.scaleLinear()
                  .range([100, 0])
                  .domain([0, 10]);
  
      const groupBins1 = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(20))
            (groupData1);
  
      const xAxis = d3.select(svg)
            .append('g')
            .attr('transform', 'translate(0,99)')
            .call(d3.axisBottom(xScale).tickSize(0).tickFormat(""));

      xAxis.select('path')
            .style('stroke', 'lightgray')
  
      const groupBins2 = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(20))
            (groupData2);
  
      const groupHistogramBar1 = d3.select(svg).selectAll('.bar1')
          .data(groupBins1)
          .enter().append('g')
          .attr('class', 'bar1')
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });
  
      groupHistogramBar1.append('rect')
          .attr('x', 0)
          .attr('width', function(d) { return 6; })
          .attr('height', function(d) { return 100 - yScale(d.length); })
          .style('fill', gs.groupColor1)
          .style('opacity', 0.5);
  
      const groupHistogramBar2 = d3.select(svg).selectAll('.bar2')
          .data(groupBins2)
          .enter().append('g')
          .attr('class', 'bar2')
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });
  
      groupHistogramBar2.append('rect')
          .attr('x', 0)
          .attr('width', function(d) { return 6; })
          .attr('height', function(d) { return 100 - yScale(d.length); })
          .style('fill', gs.groupColor2)
          .style('opacity', 0.5);
  
      return (
        <div className={styles.GroupFairnessView}>
          <div className={index.title + ' ' + styles.title}>Group Fairness</div>
          {/* <div className={styles.groupOverview}></div> */}
          <div className={styles.statParityPlot}>
            <div className={styles.subTitle}>Statistical Parity</div>
            <div className={styles.score}>89</div>
            {svg.toReact()}
          </div>
          <div className={styles.conditionalParityPlot}>
            <div className={styles.subTitle}>Conditional Parity</div>
            <div className={styles.score}>89&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;92</div>
            <div className={styles.conditionalParityPlotWrapper}>
              {svg.toReact()}
              {svg.toReact()}
            </div>
          </div>
          
        </div>
      );
    }
  }

  export default GroupFairnessView;