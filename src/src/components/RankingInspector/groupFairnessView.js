import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import UtilityView from './utilityView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class GroupFairnessView extends Component {
    constructor(props) {
      super(props);
      this.svgTopKPlot;
      this.layout = {
        wholeDistribution: {
          width: 300,
          height: 100
        },
        topKPlot: {
          width: 200,
          height: 50
        }
      };
    }
    render() {
      this.renderTopKPlot();
      const wholeRankingData = this.props.wholeRanking;
            // groupData1 = _.filter(wholeRankingData, (d) => d.group === 1),
            // groupData2 = _.filter(wholeRankingData, (d) => d.group === 2);
  
      // with random sample data
      const groupData1 = d3.range(30).map(d3.randomNormal(70, 15)), // Generate a 1000 data points using normal distribution with mean=20, deviation=5
            groupData2 = d3.range(30).map(d3.randomNormal(60, 10));
  
      // Set up the layout
      const svg = new ReactFauxDOM.Element('svg');
  
      svg.setAttribute('width', this.layout.wholeDistribution.width);
      svg.setAttribute('height', this.layout.wholeDistribution.height);
      svg.setAttribute('0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('class', 'wholeDistribution');
  
      // Both groups share the same x and y scale
      let xScale, yScale, xAxis;

      let groupBins1, groupBins2,
          groupHistogramBar1, groupHistogramBar2;
      
      xScale = d3.scaleLinear()
                .range([0, this.layout.wholeDistribution.width])
                .domain([0, 100]);
      yScale = d3.scaleLinear()
                .range([this.layout.wholeDistribution.height, 0])
                .domain([0, 10]);

      groupBins1 = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(20))
            (groupData1);
  
      xAxis = d3.select(svg)
          .append('g')
          .attr('transform', 'translate(0,99)')
          .call(d3.axisBottom(xScale).tickSize(0).tickFormat(""));

      xAxis.select('path')
          .style('stroke', 'lightgray')
  
      groupBins2 = d3.histogram()
          .domain(xScale.domain())
          .thresholds(xScale.ticks(20))
          (groupData2);
  
      groupHistogramBar1 = d3.select(svg).selectAll('.bar1')
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
  
      groupHistogramBar2 = d3.select(svg).selectAll('.bar2')
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
        <div className={styles.GroupFairnessUtilityViewWrapper}>
          <div className={styles.GroupFairnessView}>
            <div className={index.title + ' ' + styles.title}>
              Group Fairness
            </div>
            {/* <div className={styles.groupOverview}></div> */}
            <div className={styles.statParityPlot}>
              <div className={styles.subTitle}>
                Statistical Parity
              </div>
              <div className={styles.statParityPlotsWrapper}>
                {this.svgTopKPlot.toReact()}
                <div className={styles.score}>89</div>
                {svg.toReact()}
              </div>
            </div>
            <div className={styles.conditionalParityPlot}>
              <div className={styles.subTitle}>
                Conditional Parity
              </div>
              <div className={styles.conditionalParityPlotWrapper}>
                <div className={styles.topKPlot}></div>
                <div className={styles.score}>89</div>
                {svg.toReact()}
              </div>
              <div className={styles.conditionalParityPlotWrapper2}>
                <div className={styles.topKPlot}></div>
                <div className={styles.score}>92</div>
                {svg.toReact()}
              </div>
            </div>
          </div>
          <UtilityView className={styles.UtilityView} />
        </div>
      );
    }

    renderTopKPlot() {
      // Set up the layout
      this.svgTopKPlot = new ReactFauxDOM.Element('svg');
  
      this.svgTopKPlot.setAttribute('width', this.layout.topKPlot.width);
      this.svgTopKPlot.setAttribute('height', this.layout.topKPlot.height);
      this.svgTopKPlot.setAttribute('0 0 100 100');
      this.svgTopKPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svgTopKPlot.setAttribute('class', 'topKPlot');

      const xThreshold = 10, yThreshold = 4,
            groupDivision = 20;
      
      let xScale, yScale, groupColorScale,
          circleIdx = [],
          i, j, k = 0;
      
      xScale = d3.scaleBand()
          .domain(d3.range(xThreshold))
        .range([0, this.layout.topKPlot.width]);

      console.log(xScale(5));
      console.log(d3.range(xThreshold));

      yScale = d3.scaleBand()
          .domain(d3.range(yThreshold))
          .range([this.layout.topKPlot.height, 0]),

      groupColorScale = d3.scaleBand()
          .domain([0, 1])
          .range([gs.groupColor1, gs.groupColor2]);

      // Create a dataset to feed circles
      for(i=0; i < xThreshold; i++){
        for(j=0; j < yThreshold; j++){
          let group = 0;  // 0 is protected...
          
          if(k > groupDivision) {
            group = 1;
          }
          k++;

          circleIdx.push({
            x: i,
            y: j,
            sensitiveGroup: k
          });
        }
      }

      d3.select(this.svgTopKPlot).selectAll('.topKPlotCircle')
        .data(circleIdx)
        .enter().append('circle')
        .attr('class', 'topKPlotCircle')
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', 2)
        .style('fill', (d) => groupColorScale(d.sensitiveGroup));
    }
  }

  export default GroupFairnessView;