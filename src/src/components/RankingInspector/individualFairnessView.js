import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { beeswarm } from 'd3-beeswarm';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


class IndividualFairnessView extends Component {
    constructor(props) {
      super(props);
      this.svg;
      this.layout = {
        width: 650,
        height: 300,
        svg: {
          width: 585, // 90% of whole layout
          height: 250 // 100% of whole layout
        },
        groupSkew: {
          width: 55,
          height: 250
        },
        plot: {
          width: 530,
          height: 250
        },
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
  
      this.svg.setAttribute('width', this.layout.svg.width);
      this.svg.setAttribute('height', this.layout.svg.height);
      this.svg.setAttribute('0 0 200 200');
      this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svg.style.setProperty('margin', '0 5%');
  
      let data = this.props.distortions;
      console.log('data: ', data);

      // sort by observed space difference
      data = _.orderBy(data, ['observed']);
  
      const coords = this.calculateCoords(this.layout.plot.width, data.length, data),
            baselineCoords = this.calculateBaselineCoords(this.layout.plot.width, data.length, data);

      // Coordinate scales
      const xObservedScale = d3.scaleLinear()
                .range([0, this.layout.plot.width])
                .domain([0, d3.max(coords, (d) => d.x)]),
            yDecisionScale = d3.scaleLinear()
                .range([this.layout.plot.height, this.layout.plot.height * 1/2])
                .domain(d3.extent(coords, (d) => d.y));

      const gLegend = d3.select(this.svg).append('g')
              .attr('class', 'g_legend')
              .attr('transform', 'translate(0, 0)'),
            gPlot = d3.select(this.svg).append('g')
              .attr('transform', 'translate(0, 0)');

      const xAxisSetting = d3.axisTop(xObservedScale).ticks(0),
            xAxis = gPlot.append('g')
              .call(xAxisSetting)
              .attr('class', 'indi_x_axis')
              .attr('transform', 'translate(0,' + this.layout.plot.height * 3/4 + ')'),
            xAxisLine = xAxis.select('path')
              .style('stroke-width', 3);
            

      const renameBaselineCoords = _.map([...baselineCoords], (d) => 
                _.rename(_.rename(d, 'x', 'x0'), 'y', 'y0')),
            renameCoords       = _.map([...coords], (d) => 
                _.rename(_.rename(d, 'x', 'x1'), 'y', 'y1'));
  
      const combineCoords = _.map(renameBaselineCoords, function(d){
          return _.merge(
              d, 
              _.find(renameCoords, {idx: d.idx})
          )
      });

      // Color scales
      const rectColorScale = d3.scaleLinear()
              .domain(d3.extent(combineCoords, (d) => d.y1 - d.y0))
              .range(['lightgreen', 'pink']),
            pairColorScale = d3.scaleThreshold()
              .domain([1, 2, 3])  // pair is one or two or three
              .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor]);      
      
      // legend border
      gLegend.append('rect')
          .attr('class', 'legend')
          .attr('x', 3)
          .attr('y', 3)
          .attr('width', 120)
          .attr('height', 70)
          .style('fill', 'none')
          .style('shape-rendering','crispEdges')
          .style('stroke', '#2a4b5b')
          .style('stroke-width', 1.0)
          .style('opacity', 0.5);
      // Pair (node)
      gLegend.append('text')
          .attr('x', 5)
          .attr('y', 15)
          .text('Pairwise distortion')
          .style('font-size', '11px');

      // Woman-Man pair
      gLegend.append('circle')
          .attr('class', 'legend_rect')
          .attr('cx', 10)
          .attr('cy', 30)
          .attr('r', 4)
          .style('fill', pairColorScale(3))
          .style('stroke', d3.rgb(pairColorScale(3)).darker());
      gLegend.append('text')
          .attr('x', 30)
          .attr('y', 33)
          .text('Woman-Man')
          .style('font-size', '11px');
      // Man-Man pair
      gLegend.append('circle')
          .attr('class', 'legend_rect')
          .attr('cx', 10)
          .attr('cy', 45)
          .attr('r', 4)
          .style('fill', pairColorScale(1))
          .style('stroke', d3.rgb(pairColorScale(1)).darker());
      gLegend.append('text')
          .attr('x', 30)
          .attr('y', 48)
          .text('Man-Man')
          .style('font-size', '11px');  

      // Woman-Woman pair
      gLegend.append('circle')
          .attr('class', 'legend_rect')
          .attr('cx', 10)
          .attr('cy', 60)
          .attr('r', 4)
          .style('fill', pairColorScale(2))
          .style('stroke', d3.rgb(pairColorScale(2)).darker());
      gLegend.append('text')
          .attr('x', 30)
          .attr('y', 63)
          .text('Woman-Woman')
          .style('font-size', '11px');  

      const margin = 20;

      const marginRect = gPlot
              .append('rect')
              .attr('class', 'margin_rect')
              .attr('x', 0)
              .attr('y', (this.layout.plot.height * 3/4 - margin))
              .attr('width', this.layout.plot.width * 0.85)
              .attr('height', margin * 2)
              .style('fill', 'lightgreen')
              .style('opacity', 0.5)
              .style('stroke', d3.rgb('lightgreen').darker())
              .style('stroke-dasharray', '2, 2');

      const rects = gPlot
              .selectAll('.coordsRect')
              .data(combineCoords)
              .enter().append('rect')
              .attr('class', 'coordsRect')
              .attr('x', (d) => xObservedScale(d.x0))
              .attr('y', (d) => 
                  d.y1 - d.y0 > 0
                  ? yDecisionScale(d.y1 - d.y0) 
                  : yDecisionScale(d.y0)
              )
              .attr('width', 1)
              .attr('height', (d) => Math.abs(yDecisionScale(d.y1 - d.y0) - this.layout.plot.height * 3/4))
              .attr('stroke', 'gray');
  
      const coordsCircles = gPlot
              .selectAll('.coordsCircles')
              .data(combineCoords)
              .enter().append('circle')
              .attr('class', 'coordsCircles')
              .attr('cx', (d) => xObservedScale(d.x0))
              .attr('cy', (d) => yDecisionScale(d.y1))
              .attr('r', 3)
              .style('fill', (d) => pairColorScale(d.pair))
              .style('stroke', (d) => d3.rgb(pairColorScale(d.pair)).darker())
              .style('opacity', 0.8)
              .style('stroke-opacity', 0.8);

      const swarm = beeswarm()
              .data([...combineCoords].slice(0, 100))
              .distributeOn((d) => 
              yDecisionScale(d.y1))
              .radius(2)
              .orientation('vertical')
              .side('positive')
              .arrange();

      gPlot.selectAll('.beeswarm_circle')
        .data(swarm)
        .enter()
        .append('circle')
        .attr('class', 'beeswarm_circle')
        .attr('cx', function(bee) {
          return bee.x;
        })
        .attr('cy', function(bee) {
          return bee.y;
        })
        .attr('r', 2)
        .style('fill', function(bee) {
          return 'black';
        });
      
      return (
        <div className={styles.IndividualFairnessView}>
          <div className={index.title}>Individual Fairness</div>
          {this.svg.toReact()}
        </div>
      );
    }
  
    calculateCoords(w, n, data) {
      const coordsArray = [];
      let x, y, diff, distortion, pair, i,
          distortionScale = 3;
  
      for(i=0; i<n-1; i++){
        diff = data[i].observed - data[i].decision;
        distortion = diff * distortionScale;
        x = data[i].observed;
        y = distortion;
        pair = data[i].pair;
  
        coordsArray.push({
          idx: i+1,
          x: x,
          y: y,
          pair: pair
        });
      }
  
      return coordsArray;
    }
  
    calculateBaselineCoords(w, n, data) {
      const coordsArray = [];
      let x, y, diff, distortion, pair, i,
          distortionScale = 3;
  
      for(i=0; i<n-1; i++){
        diff = data[i].observed - data[i].decision;
        distortion = diff * distortionScale;
        x = data[i].observed;
        y = 0;
        pair = data[i].pair;
  
        coordsArray.push({
          idx: i+1,
          x: x,
          y: y,
          pair: pair
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
  
      d3.select(this.svg).append('path')
        .datum(combineCoords)
        .attr('class', 'area')
        .attr('d', area)
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