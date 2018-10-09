import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import UtilityView from '../UtilityView';

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
      this.svgTopKPlotTP;
      this.svgTopKPlotFP;
      this.svgWholeDistribution;
      this.svgWholeDistributionTP;
      this.svgWholeDistributionFP;

      this.layout = {
        wholeDistribution: {
          width: 200,
          height: 50
        },
        topKPlot: {
          width: 300,
          height: 50,
          circle: {
            r: 3
          }
        }
      };
    }

    renderTopKPlot(mode) {
      const data = this.props.data,
            instances = data.instances,
            topk = this.props.topk,
            topkItems = _.sortBy([...instances].slice(0, topk), ['group']);  // slice and sort

      let filteredTopkItems, numItems;
      if (mode === 'whole'){
        filteredTopkItems = topkItems;
        numItems = topk;
      } else if (mode === 'TP'){
        filteredTopkItems = _.filter(topkItems, (d) => d.target === 0);
        numItems = filteredTopkItems.length;
      } else if (mode === 'FP'){
        filteredTopkItems = _.filter(topkItems, (d) => d.target === 1);
        numItems = filteredTopkItems.length;
      }

      // Set up the layout
      let svg, svgClassName;
      svg = new ReactFauxDOM.Element('svg');
  
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', this.layout.topKPlot.height);
      svg.setAttribute('0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('class', 'topKPlot');

      let xNumCircle = 1,
          yNumCircle = 1;

      if (numItems < 4) { // 2 lines
        yNumCircle = 2;
      }
      else if (numItems < 16) {  // 4 lines
        yNumCircle = 4;
      }
      else if (numItems < 25) {  // 4 lines
        yNumCircle = 5;
      }
      else if (numItems < 36) {  // 4 lines
        yNumCircle = 6;
      }
      else if (numItems < 64) { // 8 lines
        yNumCircle = 8;
      }

      xNumCircle = Math.ceil(numItems / yNumCircle);

      const xThreshold = 10, yThreshold = 4,
            groupDivision = 20;
      
      let xTopkCircleScale, yTopkCircleScale, groupColorScale,
          topkCircleIdx = [];
          
      xTopkCircleScale = d3.scaleBand()
          .domain(d3.range(xNumCircle))
          .range([40, 40 + (this.layout.topKPlot.circle.r * 2 + 2) * xNumCircle]); // multiplied by 2 => r*2, add 2 => margin

      yTopkCircleScale = d3.scaleBand()
          .domain(d3.range(yNumCircle))
          .range([this.layout.topKPlot.height, 10]),

      groupColorScale = d3.scaleOrdinal()
          .domain([1, 2])
          .range([gs.groupColor1, gs.groupColor2]);

      // Create a dataset to feed circles
      let i, j, k = 0;
      filteredTopkItems.forEach((d) => {
        for(i=0; i < xNumCircle; i++){
          for(j=0; j < yNumCircle; j++){
            if (k < numItems){  // numWidth x numHeight of topk cirlces could exceed topk (e.g., 3x8 but topk=20)
              topkCircleIdx.push({
                x: i,
                y: j,
                group: filteredTopkItems[k].group
              });

              k++;
            }
          }
        }
      });

      d3.select(svg).selectAll('.topKPlotCircle')
        .data(topkCircleIdx)
        .enter().append('circle')
        .attr('class', 'topKPlotCircle')
        .attr('cx', (d) => xTopkCircleScale(d.x))
        .attr('cy', (d) => yTopkCircleScale(d.y))
        .attr('r', this.layout.topKPlot.circle.r)
        .style('fill', (d) => groupColorScale(d.group))
        .style('stroke', (d) => d3.rgb(groupColorScale(d.group)).darker());

      if (mode === 'whole') {
        svgClassName = 'topKPlot';
        this.svgTopKPlot = svg;     
      }
      else if (mode === 'TP') {
        svgClassName = 'topKPlotTP';
        this.svgTopKPlotTP = svg;
      }
      else if (mode === 'FP') {
        svgClassName = 'topKPlotFP';
        this.svgTopKPlotFP = svg;
      }
    }

    render() {
      if ((!this.props.data || this.props.data.length === 0)) {
        return <div />
      }

      this.renderTopKPlot('whole');
      this.renderTopKPlot('TP');
      this.renderTopKPlot('FP');

      return (
        <div className={styles.GroupFairnessViewWrapper}>
          <div className={styles.GroupFairnessView}>
            <div className={index.title + ' ' + styles.title}>
              Group Fairness
            </div>
            <div className={styles.statParityPlot}>
              <div className={styles.subTitle}>
                Statistical Parity
              </div>
              <div className={styles.statParityPlotsWrapper}>
                <div className={styles.score}>89</div>
                <div className={styles.topKPlot}>
                  {this.svgTopKPlot.toReact()}
                </div>
                {/* <div className={styles.wholeDistribution}>
                  {this.svgWholeDistribution.toReact()}
                </div> */}
              </div>
            </div>
            <div className={styles.conditionalParityPlot}>
              <div className={styles.subTitle}>
                Conditional Parity (TP/FP)
              </div>
              <div className={styles.conditionalParityPlotWrapper}>
                <div className={styles.score}>92</div>
                <div className={styles.topKPlot}>
                  {this.svgTopKPlotTP.toReact()}
                </div>
                {/* <div className={styles.wholeDistribution}>
                  {this.svgWholeDistributionTP.toReact()}
                </div> */}
              </div>
              <div className={styles.conditionalParityPlotWrapper}>
                <div className={styles.score}>89</div>
                <div className={styles.topKPlot}>
                  {this.svgTopKPlotFP.toReact()}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  export default GroupFairnessView;