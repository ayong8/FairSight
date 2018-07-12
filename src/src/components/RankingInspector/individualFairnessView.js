import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


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

  export default IndividualFairnessView;