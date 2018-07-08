import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from "../../index.css";
import gs from '../../config/_variables.scss'; // gs (=global style)

class RankingInspector extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var data = [1,2,3,4,5];

    return (
      <div className={styles.RankingInspector}>
        <IndividualFairnessView ranking={this.props.ranking} className={styles.IndividualFairnessView} />
        <RankingView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.RankingView} />
        <GroupFairnessView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.GroupFairnessView} />
        <UtilityView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.UtilityView} />
      </div>
    );
  }
}

class IndividualFairnessView extends Component {
  constructor(props) {
    super(props);


  }

  componentWillMount() {
    this.calculateDistortions();
  }

  // Plot the coordinate difference between observed(feature) and decision(ranking) space
  calculateDistortions() {
    //this.props.rankings
    // x: observed space difference, y: decision space difference
    const distortionMockup = [ 
              {x: 1, y: 2},
              {x: 2, y: 1.4},
              {x: 5, y: 4},
              {x: 6, y: 6},
              {x: 8, y: 8.8},
              {x: 10, y: 14},
              {x: 13, y: 8},
              {x: 15, y: 13},
              {x: 18, y: 17},
              {x: 20, y: 22}
            ];
  }

  render() {
    // var circles = this.props.ranking.map(d => {
    //         return (
    //           <circle cx='3' cy='4' r={d}></circle>
    //         );
    //       });

    return (
      <div>
        <div className={index.title}>Individual Fairness</div>
        <svg>
        </svg>
      </div>
    );
  }
}

/* props: this.props.ranking
  => selected ranking data
*/
class RankingView extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    console.log('gs: ', gs);
    const rankingData = this.props.ranking,
          wholeRankingData = this.props.wholeRanking;

    // Set up the layout
    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    var rectGlobalRankingScale = d3.scaleLinear()
                .range([15, 50])
                .domain(d3.extent(wholeRankingData, (d) => d.score));
    
    var rectTopKRankingScale = d3.scaleLinear()
                .range([15, 50])
                .domain(d3.extent(rankingData, (d) => d.score));

    var groupColorScale = d3.scaleOrdinal()
                .range([gs.groupColor1, gs.groupColor2])
                .domain([1, 2]);

    const gGlobalRanking = d3.select(svg).append('g')
                        .attr('class', 'g_global_ranking')
                        .attr('transform', 'translate(0,0)');
    
    const gTopKRanking = d3.select(svg).append('g')
                        .attr('class', 'g_top_k_ranking')
                        .attr('transform', 'translate(100,0)');

    console.log('g and data: ', gGlobalRanking, rankingData);

    gGlobalRanking.selectAll('.rect_global')
            .data(wholeRankingData)
            .enter().append('rect')
            .attr('class', function(d, i){
                return 'rect_global_' + i;
            })
            .attr('x', 0)
            .attr('y', function(d, i){
                return 8 * i;
            })
            .attr('width', function(d){
                return rectGlobalRankingScale(d.score);
            })
            .attr('height', 8)
            .style('fill', function(d){
                return groupColorScale(d.group);
            })
            .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style('shape-rendering', 'crispEdges');

    gTopKRanking.selectAll('.rect_global')
            .data(rankingData)
            .enter().append('rect')
            .attr('class', function(d, i){
                return 'rect_global_' + i;
            })
            .attr('x', function(d) {
              return 100 - rectTopKRankingScale(d.score);
            })
            .attr('y', function(d, i){
                return 20 * i;
            })
            .attr('width', function(d){
                return 100 - rectTopKRankingScale(d.score);
            })
            .attr('height', 20)
            .style('fill', function(d){
                return groupColorScale(d.group);
            })
            .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style('shape-rendering', 'crispEdges');

    
    return (
      <div className={styles.RankingView}>
        <div className={index.title}>Ranking Output</div>
        {svg.toReact()}
      </div>
    );
  }
}

class GroupFairnessView extends Component {
  render() {
    const wholeRankingData = this.props.wholeRanking;
          // groupData1 = _.filter(wholeRankingData, (d) => d.group === 1),
          // groupData2 = _.filter(wholeRankingData, (d) => d.group === 2);

    // with random sample data
    const groupData1 = d3.range(30).map(d3.randomNormal(70, 15)), // Generate a 1000 data points using normal distribution with mean=20, deviation=5
          groupData2 = d3.range(30).map(d3.randomNormal(60, 10));

    console.log("group data: ", groupData1, groupData2);

    // Set up the layout
    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('0 0 100 100');
    svg.setAttribute('preserveAspectRatio', "xMidYMid meet");

    // Both groups share the same x and y scale
    const xScale = d3.scaleLinear()
                .range([0, 75])
                .domain([0, 100]);
    
    const yScale = d3.scaleLinear()
                .range([50, 0])
                .domain([0, 10]);

    const groupBins1 = d3.histogram()
          .domain(xScale.domain())
          .thresholds(xScale.ticks(20))
          (groupData1);

    console.log("group1 bins: ", groupBins1);

    const groupBins2 = d3.histogram()
          .domain(xScale.domain())
          .thresholds(xScale.ticks(20))
          (groupData2);

    const groupHistogramBar1 = d3.select(svg).selectAll('.bar1')
        .data(groupBins1)
        .enter().append('g')
        .attr('class', 'bar1')
        .attr('transform', function(d) {
          console.log('d in bar: ', d, typeof(d.x0));
          return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
        });

    groupHistogramBar1.append('rect')
        .attr('x', 0)
        .attr('width', function(d) { return 4; })
        .attr('height', function(d) { return 50 - yScale(d.length); })
        .style('fill', 'red')
        .style('opacity', 0.5);

    const groupHistogramBar2 = d3.select(svg).selectAll('.bar2')
        .data(groupBins2)
        .enter().append('g')
        .attr('class', 'bar2')
        .attr('transform', function(d) {
          console.log('d in bar: ', d, typeof(d.x0));
          return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')'; 
        });

    groupHistogramBar2.append('rect')
        .attr('x', 0)
        .attr('width', function(d) { return 4; })
        .attr('height', function(d) { return 50 - yScale(d.length); })
        .style('fill', 'blue')
        .style('opacity', 0.5);

    return (
      <div className={styles.GroupFairnessView}>
        <div className={index.title + ' ' + styles.title}>Group Fairness</div>
        <div className={styles.groupOverview}></div>
        <div className={styles.statParityPlot}>
          <div className={styles.subTitle}>Statistical Parity</div>
          {svg.toReact()}
        </div>
        <div className={styles.conditionalParityPlot}>
          <div className={styles.subTitle}>Conditional Parity</div>
        </div>
        
      </div>
    );
  }
}

class UtilityView extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.UtilityView}>
        <div className={index.title}>Utility</div>
      </div>
    );
  }
}

export default RankingInspector;
