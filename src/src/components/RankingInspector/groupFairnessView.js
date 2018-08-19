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
      this.svgWholeDistribution;
      this.svgWholeDistributionTP;
      this.svgWholeDistributionFP;

      this.layout = {
        wholeDistribution: {
          width: 300,
          height: 100
        },
        topKPlot: {
          width: 200,
          height: 50,
          circle: {
            r: 3
          }
        }
      };
    }

    renderTopKPlot() {
      console.log('in rendertopkplot');

      const data = this.props.output,
            topk = this.props.topk;
      let topkItems = [...data].slice(0, topk);

      topkItems = _.sortBy(topkItems, ['group']);
      // Set up the layout
      this.svgTopKPlot = new ReactFauxDOM.Element('svg');
  
      this.svgTopKPlot.setAttribute('width', this.layout.topKPlot.width);
      this.svgTopKPlot.setAttribute('height', this.layout.topKPlot.height);
      this.svgTopKPlot.setAttribute('0 0 100 100');
      this.svgTopKPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svgTopKPlot.setAttribute('class', 'topKPlot');

      let xNumCircle = 1,
          yNumCircle = 1;

      if (topk < 4) { // 2 lines
        yNumCircle = 2;
      }
      else if (topk < 16) {  // 4 lines
        yNumCircle = 4;
      }
      else if (topk < 25) {  // 4 lines
        yNumCircle = 5;
      }
      else if (topk < 36) {  // 4 lines
        yNumCircle = 6;
      }
      else if (topk < 64) { // 8 lines
        yNumCircle = 8;
      }

      xNumCircle = Math.ceil(topk / yNumCircle);

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
      topkItems.forEach((d) => {
        for(i=0; i < xNumCircle; i++){
          for(j=0; j < yNumCircle; j++){
            if (k < topk){  // numWidth x numHeight of topk cirlces could exceed topk (e.g., 3x8 but topk=20)
              topkCircleIdx.push({
                x: i,
                y: j,
                group: topkItems[k].group
              });

              k++;
            }
          }
        }
      });

      d3.select(this.svgTopKPlot).selectAll('.topKPlotCircle')
        .data(topkCircleIdx)
        .enter().append('circle')
        .attr('class', 'topKPlotCircle')
        .attr('cx', (d) => xTopkCircleScale(d.x))
        .attr('cy', (d) => yTopkCircleScale(d.y))
        .attr('r', this.layout.topKPlot.circle.r)
        .style('fill', (d) => groupColorScale(d.group))
        .style('stroke', (d) => d3.rgb(groupColorScale(d.group)).darker());
    }

    renderWholeDistribution(mode) {
      console.log('in renderwholddistribution');
      let data = this.props.data,
          topk = this.props.topk,
          dataTopk = [...data].slice(0, topk);

      const histoData = mode === 'whole'? [...data]
                      : 'TP'? _.filter(dataTopk, (d) => Object.values(d.y)[0] === 0)
                      : 'FP'? _.filter(dataTopk, (d) => Object.values(d.y)[0] === 1)
                      : 'error';
  
      const dataGroup1 = _.chain(histoData)
                          .filter((d) => d.group === 1)
                          .map((d) => d.score)
                          .value(),
            dataGroup2 = _.chain(histoData)
                          .filter((d) => d.group === 2)
                          .map((d) => d.score)
                          .value();
      
      const dataBinGroup1 = d3.histogram()
                        .domain([0, 100])
                        .thresholds(d3.range(0, 100, 5))
                        (dataGroup1),
            dataBinGroup2 = d3.histogram()
                        .domain([0, 100])
                        .thresholds(d3.range(0, 100, 5))
                        (dataGroup2);

      let svgClassName;
      // Set up the layout
      if (mode === 'whole') {
        console.log('com here');
        svgClassName = 'wholeDistribution';
        this.svgWholeDistribution = new ReactFauxDOM.Element('svg');

        this.svgWholeDistribution.setAttribute('width', this.layout.wholeDistribution.width);
        this.svgWholeDistribution.setAttribute('height', this.layout.wholeDistribution.height - 50);
        this.svgWholeDistribution.setAttribute('0 0 100 100');
        this.svgWholeDistribution.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svgWholeDistribution.setAttribute('class', svgClassName);
      }
      else if (mode === 'TP') {
        svgClassName = 'wholeDistributionTP';
        this.svgWholeDistributionTP = new ReactFauxDOM.Element('svg');

        this.svgWholeDistributionTP.setAttribute('width', this.layout.wholeDistribution.width);
        this.svgWholeDistributionTP.setAttribute('height', this.layout.wholeDistribution.height - 50);
        this.svgWholeDistributionTP.setAttribute('0 0 100 100');
        this.svgWholeDistributionTP.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svgWholeDistributionTP.setAttribute('class', svgClassName);
      }
      else if (mode === 'FP') {
        svgClassName = 'wholeDistributionFP';
        this.svgWholeDistributionFP = new ReactFauxDOM.Element('svg');

        this.svgWholeDistributionFP.setAttribute('width', this.layout.wholeDistribution.width);
        this.svgWholeDistributionFP.setAttribute('height', this.layout.wholeDistribution.height - 50);
        this.svgWholeDistributionFP.setAttribute('0 0 100 100');
        this.svgWholeDistributionFP.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svgWholeDistributionFP.setAttribute('class', svgClassName);
      }
  
      console.log(this.wholeDistribution);
      // Both groups share the same x and y scale
      let xScale, yScale, xAxis;

      let groupHistogramBar1, groupHistogramBar2;

      xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.layout.wholeDistribution.width]),
      yScale = d3.scaleLinear()
            .domain([0, 10])
            .range([this.layout.wholeDistribution.height - 50, 0]);
  
      xAxis = d3.select('.' + svgClassName)
          .append('g')
          .attr('transform', 'translate(0,49)')
          .call(d3.axisBottom(xScale).tickSize(0).tickFormat(""));

      xAxis.select('path')
          .style('stroke', 'lightgray');
  
      groupHistogramBar1 = d3.select('.' + svgClassName).selectAll('.bar1')
          .data(dataBinGroup1)
          .enter().append('g')
          .attr('class', 'bar1')
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });
  
      groupHistogramBar1.append('rect')
          .attr('x', 0)
          .attr('width', function(d) { return 15; })
          .attr('height', function(d) { return 100 - yScale(d.length); })
          .style('fill', gs.groupColor1)
          .style('opacity', 0.5)
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);
  
      groupHistogramBar2 = d3.select('.' + svgClassName).selectAll('.bar2')
          .data(dataBinGroup2)
          .enter().append('g')
          .attr('class', 'bar2')
          .attr('transform', function(d) {
            return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
          });
  
      groupHistogramBar2.append('rect')
          .attr('x', 0)
          .attr('width', function(d) { return 15; })
          .attr('height', function(d) { return 100 - yScale(d.length); })
          .style('fill', gs.groupColor2)
          .style('opacity', 0.5)
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.5);
        
    }

    render() {
      if ((!this.props.data || this.props.data.length === 0) ||
          (!this.props.output || this.props.output.length === 0) || 
          (!this.props.ranking || this.props.ranking.length === 0)
         ) {
        return <div />
      }

      console.log('here');
      this.renderTopKPlot();
      this.renderWholeDistribution('whole');
      this.renderWholeDistribution('TP');
      this.renderWholeDistribution('FP');

      return (
        <div className={styles.GroupFairnessUtilityViewWrapper}>
          <div className={styles.GroupFairnessView}>
            <div className={index.title + ' ' + styles.title}>
              Group Fairness
            </div>
            <div className={styles.statParityPlot}>
              <div className={styles.subTitle}>
                Statistical Parity
              </div>
              <div className={styles.statParityPlotsWrapper}>
                <div className={styles.topKPlot}>
                  {this.svgTopKPlot.toReact()}
                </div>
                <div className={styles.score}>89</div>
                <div className={styles.wholeDistribution}>
                  {this.svgWholeDistribution.toReact()}
                </div>
              </div>
            </div>
            <div className={styles.conditionalParityPlot}>
              <div className={styles.subTitle}>
                Conditional Parity (TP/FP)
              </div>
              <div className={styles.conditionalParityPlotWrapper}>
                <div className={styles.topKPlot}>
                  {this.svgTopKPlot.toReact()}
                </div>
                <div className={styles.score}>92</div>
                <div className={styles.wholeDistribution}>
                  {this.svgWholeDistributionTP.toReact()}
                </div>
              </div>
              <div className={styles.conditionalParityPlotWrapper}>
                <div className={styles.topKPlot}>
                  {this.svgTopKPlot.toReact()}
                </div>
                <div className={styles.score}>89</div>
                <div className={styles.wholeDistribution}>
                  {this.svgWholeDistributionFP.toReact()}
                </div>
              </div>
            </div>
          </div>
          <UtilityView className={styles.UtilityView} />
        </div>
      );
    }
  }

  export default GroupFairnessView;