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

    }
  
    render() {
      this.svg = new ReactFauxDOM.Element('svg');
  
      this.svg.setAttribute('width', this.layout.width * 0.9);
      this.svg.setAttribute('height', this.layout.height);
      this.svg.setAttribute('0 0 200 200');
      this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svg.style.setProperty('border-bottom', '1px solid lightgray');
      this.svg.style.setProperty('margin', '0 5%');
  
      console.log('this.props: ', this.props);
  
      let data = this.props.distortions;
      console.log('data: ', data);

      // sort by observed space difference
      data = _.orderBy(data, ['observed']);
  
      const coords = this.calculateCoords(this.layout.width, data.length, data);
      const baselineCoords = this.calculateBaselineCoords(this.layout.width, data.length, data);
      console.log('coords: ', coords);
      console.log('baselineCoords: ', baselineCoords);

      const xObservedScale = d3.scaleLinear()
            .range([0, this.layout.width])
            .domain([0, d3.max(coords, (d) => d.x)]);

      const yDecisionScale = d3.scaleLinear()
              .range([this.layout.height * 3/4, this.layout.height * 1/4])
              .domain(d3.extent(coords, (d) => d.y));

      const gGraph = d3.select(this.svg).append('g')
              .attr('transform', 'translate(0, 0)');

      const xAxisSetting = d3.axisBottom(xObservedScale).ticks(0);

      const xAxis = gGraph.append('g')
              .call(xAxisSetting)
              .attr('transform', 'translate(0,' + this.layout.height/2 + ')');
      
      const coordsCircles = gGraph
              .selectAll('.coords')
              .data(coords)
              .enter().append('circle')
              .attr('class', 'coordsCircles')
              .attr('cx', function(d) { return xObservedScale(d.x); })
              .attr('cy', function(d) { return yDecisionScale(d.y); })
              .attr('r', 0.5)
              .style('fill', 'black')
              .style('opacity', 0.8);
  
      const distortionCurvedPath =  gGraph
              .append('path')
              .datum(coords)
              .attr('class', 'line')
              .style('stroke', function() { // Add the colours dynamically
                      return 'gray'; })
              .style('stroke-width', 0.5)
              .style('stroke-opacity', 0.8)
              .style('fill', 'none')
              //.attr('id', 'tag'+i) // assign ID
              .attr('d', d3.line()
                          .curve(d3.curveCardinalOpen.tension(0))
                          .x(function(d) { return xObservedScale(d.x); })
                          .y(function(d) { return yDecisionScale(d.y); })
                      );
  
      const renameBaselineCoords = _.map([...baselineCoords], (d) => _.rename(_.rename(d, 'x', 'x0'), 'y', 'y0'));
      const renameCoords       = _.map([...coords], (d) => _.rename(_.rename(d, 'x', 'x1'), 'y', 'y1'));
  
      const combineCoords = _.map(renameBaselineCoords, function(d){
          return _.merge(
              d, 
              _.find(renameCoords, {idx: d.idx})
          )
      });

      console.log(combineCoords);
  
      const area = d3.area()
              .curve(d3.curveCardinalOpen.tension(0))
              .x(function(d) { return xObservedScale(d.x0); })
              .y0((d) => yDecisionScale(d.y0))
              .y1((d) => yDecisionScale(d.y1));

      const areaColorScale = d3.scaleLinear()
              .domain(combineCoords, (d) => d.y1 - d.y0)
              .range(["lavender", "mediumpurple", "indigo"])
  
      gGraph.append("path")
        .datum(combineCoords)
        .attr("class", "area")
        .attr("d", area)
        .style('fill', ' url(#area-gradient)')
        .style('opacity', 0.7)

      d3.select(this.svg).append("linearGradient")				
          .attr("id", "area-gradient")			
          .attr("gradientUnits", "userSpaceOnUse")	
          .attr("x1", 0).attr("y1", yDecisionScale(0))			
          .attr("x2", 0).attr("y2", yDecisionScale(1))		
          .selectAll("stop")						
          .data([								
              {offset: "0%", color: "red"},		
              {offset: "30%", color: "black"},	
              {offset: "45%", color: "black"},		
              {offset: "55%", color: "black"},		
              {offset: "60%", color: "lawngreen"},	
              {offset: "100%", color: "lawngreen"}	
          ])						
          .enter().append("stop")			
          .attr("offset", function(d) { return d.offset; })	
          .attr("stop-color", function(d) { return d.color; });
      
      return (
        <div className={styles.IndividualFairnessView}>
          {this.svg.toReact()}
        </div>
      );
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