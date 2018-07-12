import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

_.rename = function(obj, key, newKey) {
  
  if(_.includes(_.keys(obj), key)) {
    obj[newKey] = _.clone(obj[key], true);

    delete obj[key];
  }
  
  return obj;
};


class RankingInspector extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var data = [1,2,3,4,5];

    return (
      <div className={styles.RankingInspector}>
        <ProcessView distortions={this.props.distortions} ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.ProcessView} />
        <GroupFairnessView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.GroupFairnessView} />
        <UtilityView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.UtilityView} />
      </div>
    );
  }
}

class ProcessView extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.ProcessView}>
        <div className={styles.processIndicator}>
          <div className={index.title}>Input</div>
          <div className={index.title}>Individual Fairness</div>
          <div className={index.title}>Output</div>
        </div>
        <IndividualFairnessView distortions={this.props.distortions} ranking={this.props.ranking} className={styles.IndividualFairnessView} />
        {/* <RankingView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} /> */}
      </div>
    );
  }
}

class IndividualFairnessView extends Component {
  constructor(props) {
    super(props);
    this.svg;
    this.layout = {
      width: 650,
      height: 125,
      get r() {
        return d3.min([this.width, this.height]) / 3;
      },
      get centroid() {
        return {
          x: this.width / 2,
          y: this.height / 2
        };
      }
    };

  }

  componentWillMount() {
    //this.calculateDistortions();
  }

  // Plot the coordinate difference between observed(feature) and decision(ranking) space
  // calculateDistortions() {
  //   //this.props.rankings
  //   // x: observed space difference, y: decision space difference
  //   const distortionMockup = [ 
  //             {x: 1, y: 2},
  //             {x: 2, y: 1.4},
  //             {x: 5, y: 4},
  //             {x: 6, y: 6},
  //             {x: 8, y: 8.8},
  //             {x: 10, y: 14},
  //             {x: 13, y: 8},
  //             {x: 15, y: 13},
  //             {x: 18, y: 17},
  //             {x: 20, y: 22}
  //           ];
  // }

  render() {
    this.svg = new ReactFauxDOM.Element('svg');

    this.svg.setAttribute('width', this.layout.width);
    this.svg.setAttribute('height', this.layout.height);
    this.svg.setAttribute('0 0 200 200');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    console.log('this.props: ', this.props);

    const data = this.props.distortions;
    const distortionScale = 2;
    const diffs = _.map(data, (d) => (d.observed - d.decision) * distortionScale);
    console.log(diffs);

    const xObservedScale = d3.scaleLinear()
            .range([0, this.layout.width])
            .domain([0, d3.max(data, (d) => d.observed)]);

    const yDecisionScale = d3.scaleLinear()
            .range([0, this.layout.height])
            .domain(d3.extent(diffs));

    const coords = this.calculateCoords(this.layout.width, data.length, data);
    const baselineCoords = this.calculateBaselineCoords(this.layout.width, data.length, data);
    
    const coordsCircles = d3.select(this.svg)
            .selectAll('.coords')
            .data(coords)
            .enter().append('circle')
            .attr('class', 'coordsCircles')
            .attr('cx', function(d) { return xObservedScale(d.x); })
            .attr('cy', function(d) { return yDecisionScale(d.y); })
            .attr('r', 2)
            .style('fill', 'red');

    const distortionCurvedPath =  d3.select(this.svg)
            .append('path')
            .datum(coords)
            .attr('class', 'line')
            .style('stroke', function() { // Add the colours dynamically
                    return 'black'; })
            .style('stroke-width', 1.5)
            .style('stroke-opacity', 1)
            .style('fill', 'none')
            //.attr('id', 'tag'+i) // assign ID
            .attr('d', d3.line()
                        .curve(d3.curveCardinalOpen.tension(0))
                        .x(function(d) { return xObservedScale(d.x); })
                        .y(function(d) { return yDecisionScale(d.y); })
                    );

    const renameBaselineCoords = _.map(baselineCoords, (d) => _.rename(_.rename(d, 'x', 'x0'), 'y', 'y0'));
    const renameCoords       = _.map(coords, (d) => _.rename(_.rename(d, 'x', 'x1'), 'y', 'y1'));

    const combineCoords = _.map(renameBaselineCoords, function(d){
        return _.merge(
            d, 
            _.find(renameCoords, {idx: d.idx})
        )
    });

    const area = d3.area()
            .curve(d3.curveCardinalOpen.tension(0))
            .x(function(d) { return xObservedScale(d.x0); })
            .y0((d) => yDecisionScale(d.y0))
            .y1((d) => yDecisionScale(d.y1));

    d3.select(this.svg).append("path")
      .datum(combineCoords)
      .attr("class", "area")
      .attr("d", area)
      .style('fill', 'none');
    
    return (
      <div className={styles.IndividualFairnessView}>
        {this.svg.toReact()}
      </div>
    );
  }

  renderCircularView() {
    const data = this.props.distortions;

    const xObservedScale = d3.scaleLinear()
            .range([0, this.layout.width])
            .domain([0, d3.max(data, (d) => d.observed)]);

    const yDecisionScale = d3.scaleLinear()
            .range([this.layout.height, 0])
            .domain([0, d3.max(data, (d) => d.decision)]);

    const bigCircle = d3.select(this.svg)
            .append('circle')
            .attr('class', 'bigCircle')
            .attr('cx', (d) => this.layout.centroid.x)
            .attr('cy', (d) => this.layout.centroid.y)
            .attr('r', this.layout.r)
            .style('stroke', '#c18f02')
            .style('stroke-width', 5)
            .style('fill', '#ffbc00')
            .style('opacity', 0.5);

    const diffs = _.map(data, (d) => d.observed - d.decision);

    const coords = this.calculateCircularCoords(this.layout.r, this.layout.width, data.length, diffs);
    const circleCoords = this.calculateCircularCoords(this.layout.r, this.layout.width, data.length, new Array(data.length).fill(0));

    const coordsCircles = d3.select(this.svg)
            .selectAll('.coordsCircles')
            .data(coords)
            .enter().append('circle')
            .attr('class', 'coordsCircles')
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', 2)
            .style('fill', 'red');

    const distortionCurvedPath =  d3.select(this.svg)
            .append('path')
            .datum(coords)
            .attr('class', 'line')
            .style('stroke', function() { // Add the colours dynamically
                    return '#ff9900'; })
            .style('stroke-width', 8)
            .style('stroke-opacity', 0.5)
            .style('fill', 'none')
            //.attr('id', 'tag'+i) // assign ID
            .attr('d', d3.line()
                        .curve(d3.curveCardinalOpen.tension(0))
                        .x(function(d) { return d.x; })
                        .y(function(d) { return d.y; })
                    );

    const renameCircleCoords = _.map(circleCoords, (d) => _.rename(_.rename(d, 'x', 'x0'), 'y', 'y0'));
    const renameCoords       = _.map(coords, (d) => _.rename(_.rename(d, 'x', 'x1'), 'y', 'y1'));

    const combineCoords = _.map(renameCircleCoords, function(d){
        return _.merge(
            d, 
            _.find(renameCoords, {idx: d.idx})
        )
    });

    const area = d3.area()
            .curve(d3.curveCardinalOpen.tension(0))
            .x(function(d) { return d.x0; })
            .y0((d) => d.y0)
            .y1((d) => d.y1);

    d3.select(this.svg).append("path")
      .datum(combineCoords)
      .attr("class", "area")
      .attr("d", area)
      .style('fill', 'none');
  }

  calculateCoords(w, n, data) {
    const coordsArray = [];
    let x, y, diff, distortion, i,
        distortionScale = 3;

    for(i=0; i<n-1; i++){
      diff = data[i].observed - data[i].decision;
      distortion = diff * distortionScale;
      x = data[i].observed;
      y = distortion;

      coordsArray.push({
        idx: i+1,
        x: x,
        y: y
      });
    }

    return coordsArray;
  }

  calculateBaselineCoords(w, n, data) {
    const coordsArray = [];
    let x, y, diff, distortion, i,
        distortionScale = 3;

    for(i=0; i<n-1; i++){
      diff = data[i].observed - data[i].decision;
      distortion = diff * distortionScale;
      x = data[i].observed;
      y = 0;

      coordsArray.push({
        idx: i+1,
        x: x,
        y: y
      });
    }

    return coordsArray;
  }

  calculateCircularCoords(r, w, n, diffs) {
    const coordsArray = [];
    let x, y, angle, distortion, i,
        distortionScale = 7;

    for(i=0; i<n-1; i++){
      angle = (i / (n/2)) * Math.PI;
      distortion = diffs[i] * distortionScale;
      //angle += 360/n * i;
      x = w/2 + ((r+distortion) * Math.sin(angle));
      y = w/2 + ((r+distortion) * Math.cos(angle));

      coordsArray.push({
        idx: i+1,
        x: x,
        y: y,
        angle: angle,
      });
    }
    
    return coordsArray;
  }
}

// /* props: this.props.ranking
//   => selected ranking data
// */
// class RankingView extends Component {
//   constructor(props) {
//     super(props);
//   }
//   render() {
//     const rankingData = this.props.ranking,
//           wholeRankingData = this.props.wholeRanking;

//     // Set up the layout
//     const svgRankingView = new ReactFauxDOM.Element('svg');

//     svgRankingView.setAttribute('width', '100%');
//     svgRankingView.setAttribute('height', '100%');

//     var rectGlobalRankingScale = d3.scaleLinear()
//                 .range([15, 50])
//                 .domain(d3.extent(wholeRankingData, (d) => d.score));
    
//     var rectTopKRankingScale = d3.scaleLinear()
//                 .range([15, 100])
//                 .domain(d3.extent(rankingData, (d) => d.score));

//     var groupColorScale = d3.scaleOrdinal()
//                 .range([gs.groupColor1, gs.groupColor2])
//                 .domain([1, 2]);

//     const gGlobalRanking = d3.select(svgRankingView).append('g')
//                         .attr('class', 'g_global_ranking')
//                         .attr('transform', 'translate(0,0)');
    
//     const gTopKRanking = d3.select(svgRankingView).append('g')
//                         .attr('class', 'g_top_k_ranking')
//                         .attr('transform', 'translate(150,0)');

//     gGlobalRanking.selectAll('.rect_global')
//             .data(wholeRankingData)
//             .enter().append('rect')
//             .attr('class', function(d, i){
//                 return 'rect_global_' + i;
//             })
//             .attr('x', 0)
//             .attr('y', function(d, i){
//                 return 8 * i;
//             })
//             .attr('width', function(d){
//                 return rectGlobalRankingScale(d.score);
//             })
//             .attr('height', 8)
//             .style('fill', function(d){
//                 return groupColorScale(d.group);
//             })
//             .style('stroke', 'white')
//             .style('stroke-width', 1)
//             .style('shape-rendering', 'crispEdges');

//     gTopKRanking.selectAll('.rect_global')
//             .data(rankingData)
//             .enter().append('rect')
//             .attr('class', function(d, i){
//                 return 'rect_global_' + i;
//             })
//             .attr('x', function(d) {
//               return 100 - rectTopKRankingScale(d.score);
//             })
//             .attr('y', function(d, i){
//                 return 20 * i;
//             })
//             .attr('width', function(d){
//                 return rectTopKRankingScale(d.score);
//             })
//             .attr('height', 20)
//             .style('fill', function(d){
//                 return groupColorScale(d.group);
//             })
//             .style('stroke', 'white')
//             .style('stroke-width', 1)
//             .style('shape-rendering', 'crispEdges');

    
//     return (
//       <div className={styles.RankingView}>
//         <div className={index.title}>Ranking Output</div>
//         {svgRankingView.toReact()}
//       </div>
//     );
//   }
// }

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

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '50px');
    svg.setAttribute('0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Both groups share the same x and y scale
    const xScale = d3.scaleLinear()
                .range([0, 75])
                .domain([0, 100]);
    
    const yScale = d3.scaleLinear()
                .range([45, 0])
                .domain([0, 10]);

    const groupBins1 = d3.histogram()
          .domain(xScale.domain())
          .thresholds(xScale.ticks(20))
          (groupData1);

    const xAxis = d3.select(svg)
          .append('g')
          .attr('transform', 'translate(0,45)')
          .call(d3.axisBottom(xScale).tickSize(0).tickFormat(""));

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
        .attr('width', function(d) { return 4; })
        .attr('height', function(d) { return 45 - yScale(d.length); })
        .style('fill', 'red')
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
        .attr('width', function(d) { return 4; })
        .attr('height', function(d) { return 45 - yScale(d.length); })
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
          {svg.toReact()}
          {svg.toReact()}
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
