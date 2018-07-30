import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { beeswarm } from 'd3-beeswarm';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


class IndividualFairnessView extends Component {
    constructor(props) {
      super(props);

      this.sortDistortion = this.sortDistortion.bind(this);
      this.handleSelectSorting = this.handleSelectSorting.bind(this);
      this.combinedCoordsData = [],
      this.xObservedScale;
      this.yDecisionScale;
      this.xGroupSkewScale
      this.yGroupSkewScale;

      this.state = {
        dropdownOpen: false,
        sortBy: 'close to far'
      };

      this.svg;
      this.layout = {
        width: 650,
        height: 300,
        svg: {
          width: 750, // 90% of whole layout
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
      let self = this;

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
      this.xObservedScale = d3.scaleLinear()
            .range([0, this.layout.plot.width])
            .domain([0, d3.max(coords, (d) => d.x)]),
      this.yDecisionScale = d3.scaleLinear()
            .range([this.layout.plot.height - 5, this.layout.plot.height * 1/2])
            .domain(d3.extent(coords, (d) => d.y)),
      this.xGroupSkewScale = d3.scaleBand()
            .range([0, this.layout.groupSkew.width])
            .domain([0, 1, 2, 3, 4]);
      this.yGroupSkewScale = d3.scaleLinear()
            .range([this.layout.plot.height - 5, this.layout.plot.height * 1/2])
            .domain([-10, 10]);

      const gLegend = d3.select(this.svg).append('g')
              .attr('class', 'g_legend')
              .attr('transform', 'translate(0, 0)'),
            gPlot = d3.select(this.svg).append('g')
              .attr('class', 'g_plot')
              .attr('transform', 'translate(0, 0)'),
            gViolinPlot = gPlot.append('g')
              .attr('class', 'g_violin_plot')
              .attr('transform', 'translate(570, 0)'),
            gGroupSkew = gPlot.append('g')
              .attr('transform', 'translate(650, 0)');

      const xAxisSetting = d3.axisTop(this.xObservedScale).tickSize(0).ticks(0),
            yAxisSetting = d3.axisRight(this.yDecisionScale).tickSize(0).ticks(0),
            xAxisGroupSkewSetting = d3.axisTop(this.xObservedScale).tickSize(0).ticks(0),
            yAxisGroupSkewSetting = d3.axisLeft(this.yGroupSkewScale).tickSize(0).ticks(0),

            xAxis = gPlot.append('g')
              .call(xAxisSetting)
              .attr('class', 'indi_x_axis')
              .attr('transform', 'translate(0,' + this.layout.plot.height * 3/4 + ')'),
            yAxis = gPlot.append('g')
              .call(yAxisSetting)
              .attr('class', 'indi_y_axis')
              .attr('transform', 'translate(0,0)'),
            yAxisGroupSkew = gGroupSkew.append('g')
              .call(yAxisSetting)
              .attr('class', 'group_skew_y_axis')
              .attr('transform', 'translate(60,0)'),
            xAxisLine = xAxis.select('path')
              .style('stroke-width', 3),
            yAxisLine = yAxis.select('path')
              .style('stroke-width', 3),
            xAxisViolinPlotLine = gViolinPlot.append('line')
              .attr('x1', -20)
              .attr('y1', this.layout.plot.height * 3/4)
              .attr('x2', 70)
              .attr('y2', this.layout.plot.height * 3/4)
              .style('stroke-dasharray', '3,3')
              .style('stroke', 'lightgray')
              .style('stroke-width', 3),
            yAxisGroupSkewLine = yAxisGroupSkew.select('path')
              .style('stroke-width', 3);
            

      const renameBaselineCoords = _.map([...baselineCoords], (d) => 
                _.rename(_.rename(d, 'x', 'x0'), 'y', 'y0')),
            renameCoords       = _.map([...coords], (d) => 
                _.rename(_.rename(d, 'x', 'x1'), 'y', 'y1'));
  
      this.combinedCoordsData = _.map(renameBaselineCoords, function(d){
          return _.merge(
              d, 
              _.find(renameCoords, {idx: d.idx})
          )
      });

      // Color scales
      const rectColorScale = d3.scaleLinear()
              .domain(d3.extent(this.combinedCoordsData, (d) => d.y1 - d.y0))
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

      const margin = 20,
            outLierMargin = 5;

      const marginRect = gPlot
              .append('rect')
              .attr('class', 'margin_rect')
              .attr('x', 0)
              .attr('y', (this.layout.plot.height * 3/4 - margin))
              .attr('width', this.layout.plot.width)
              .attr('height', margin * 2)
              .style('fill', 'lightblue')
              .style('opacity', 0.5)
              .style('stroke', d3.rgb('lightgreen').darker())
              .style('stroke-dasharray', '2, 2');

      const rects = gPlot
              .selectAll('.coords_rect')
              .data(this.combinedCoordsData)
              .enter().append('rect')
              .attr('class', 'coords_rect')
              .attr('x', (d) => this.xObservedScale(d.x0))
              .attr('y', (d) => 
                  d.y1 - d.y0 > 0
                  ? this.yDecisionScale(d.y1 - d.y0) 
                  : this.yDecisionScale(d.y0)
              )
              .attr('width', 0.05)
              .attr('height', (d) => Math.abs(this.yDecisionScale(d.y1 - d.y0) - this.layout.plot.height * 3/4))
              .style('stroke', 'black')
              .style('stroke-width', 0.5);
  
      const coordsCircles = gPlot
              .selectAll('.coords_circle')
              .data(this.combinedCoordsData)
              .enter().append('circle')
              .attr('class', 'coords_circle')
              .attr('cx', (d) => this.xObservedScale(d.x0))
              .attr('cy', (d) => this.yDecisionScale(d.y1))
              .attr('r', 3)
              .style('fill', (d) => pairColorScale(d.pair))
              .style('stroke', (d) => d3.rgb(pairColorScale(d.pair)).darker())
              .style('opacity', 0.8)
              .style('stroke-opacity', 0.8)
              .on('mouseover', function(d, i) {
                    var selectedCircleIdx = i;
                    
                    d3.selectAll('circle.coords_circle')
                      .filter(function(e, i) {
                        return (i !== selectedCircleIdx);
                      })
                      .style('opacity', 0.2);
                    
                    d3.select(this).attr('opacity','0');

                    d3.selectAll('.coords_rect')
                      .style('opacity', 0.2);

                    // Draw half circle heading the arc toward what it goes

                    console.log('gPlot: ', gPlot);
                    console.log('margin: ', margin);

                    var circleArc = d3.arc()
                      .innerRadius(0)
                      .outerRadius(5)
                      .startAngle(0)
                      .endAngle(Math.PI);

                    // left semicircle
                    d3.select('.g_plot')
                      .append("path")
                      .attr("class", 'mouseoverPairColor mouseoverPairCircleRight')
                      .attr("d", circleArc)
                      .attr("transform", function(e) {
                        return "translate(" + (self.xObservedScale(d.x0) - 1) + "," + self.yDecisionScale(d.y1) + ")" + "rotate(180)"
                      })
                      .style("stroke", (e) => d3.rgb(pairColorScale(d.pair)).darker())
                      .style("fill", (e) => pairColorScale(d.pair));

                    // right semicircle
                    d3.select('.g_plot')
                      .append("path")
                      .attr("class", 'mouseoverPairColor mouseoverPairCircleRight')
                      .attr("d", circleArc)
                      .attr("transform", function(e) {
                        return "translate(" + (self.xObservedScale(d.x0) + 1) + "," + self.yDecisionScale(d.y1) + ")" + "rotate(0)"
                      })
                      .style("stroke", (e) => d3.rgb(pairColorScale(d.pair)).darker())
                      .style("fill", (e) => pairColorScale(d.pair));
              })
              .on('mouseout', (d) => {
                    d3.selectAll('.coords_circle')
                      .style('opacity', 0.8);

                    d3.selectAll('.coords_rect')
                      .style('opacity', 1);

                    d3.selectAll('.mouseoverPairColor').remove();
              });

      
      // Violin plot for summary
      const swarm = beeswarm()
              .data(_.filter(this.combinedCoordsData, (d) => d.pair === 1).slice(0, 50))
              .distributeOn((d) => this.yDecisionScale(d.y1))
              .radius(2)
              .orientation('vertical')
              .side('symmetric')
              .arrange();

      gViolinPlot.selectAll('.beeswarm_circle')
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
        .attr('r', 3)
        .style('fill', (bee) => pairColorScale(bee.datum.pair))
        .style('stroke', (bee) => d3.rgb(pairColorScale(bee.datum.pair)).darker());

      const swarm2 = beeswarm()
              .data(_.filter(this.combinedCoordsData, (d) => d.pair === 2).slice(0, 50))
              .distributeOn((d) => this.yDecisionScale(d.y1))
              .radius(2)
              .orientation('vertical')
              .side('symmetric')
              .arrange();

      gViolinPlot.selectAll('.beeswarm_circle2')
        .data(swarm2)
        .enter()
        .append('circle')
        .attr('class', 'beeswarm_circle2')
        .attr('cx', function(bee) {
          return bee.x + 30;
        })
        .attr('cy', function(bee) {
          return bee.y;
        })
        .attr('r', 3)
        .style('fill', (bee) => pairColorScale(bee.datum.pair))
        .style('stroke', (bee) => d3.rgb(pairColorScale(bee.datum.pair)).darker());

      // Group skew
      const sampleGroupSkewSum = {
            groupPairs1: -3,
            groupPairs2: -5,
            betweenPairs: 8
          };
      let groupSkewRect1, groupSkewCircle1,
          idx = 1;

      console.log('dddd');
      console.log(this.layout.groupSkew.width);
      
      // Go over all sum of skews
      // idx => 1: groupPairs1, 2: groupPairs2, 3: betweenPairs
      _.mapValues(sampleGroupSkewSum, (sumSkew) => {
        console.log(sumSkew, this.xGroupSkewScale(idx));
        gGroupSkew
            .append('rect')
            .attr('class', 'groupSkewRect')
            .attr('x', this.xGroupSkewScale(idx))
            .attr('y', (d) => 
              sumSkew > 0
                ? this.yGroupSkewScale(sumSkew) 
                : this.yGroupSkewScale(0)
            )
            .attr('width', idx)
            .attr('height', Math.abs(this.yGroupSkewScale(sumSkew) - this.yGroupSkewScale(0)))
            .style('fill', pairColorScale(idx))
            .style('stroke', 'black')
            .style('stroke-width', 0.5);

        gGroupSkew
            .append('circle')
            .attr('class', 'groupSkewCircle')
            .attr('cx', this.xGroupSkewScale(idx))
            .attr('cy', this.yGroupSkewScale(sumSkew))
            .attr('r', 6)
            .style('fill', pairColorScale(idx))
            .style('stroke', d3.rgb(pairColorScale(idx)).darker())
            .style('stroke-opacity', 0.8);
        
        idx++;
      });

      // groupSkewRect1 = gGroupSkew
      //     .append('rect')
      //     .attr('class', 'groupSkewRect')
      //     .attr('x', 68.5)
      //     .attr('y', (d) => 
      //       sampleGroupSkewSum.betweenPairs > 0
      //         ? this.yGroupSkewScale(sampleGroupSkewSum.betweenPairs) 
      //         : this.yGroupSkewScale(0)
      //     )
      //     .attr('width', 3)
      //     .attr('height', Math.abs(this.yGroupSkewScale(sampleGroupSkewSum.betweenPairs) - this.yGroupSkewScale(0)))
      //     .style('fill', pairColorScale(3))
      //     .style('stroke', 'black')
      //     .style('stroke-width', 0.5);

      // groupSkewCircle1 = gGroupSkew
      //     .append('circle')
      //     .attr('class', 'groupSkewCircle')
      //     .attr('cx', 70)
      //     .attr('cy', this.yGroupSkewScale(sampleGroupSkewSum.betweenPairs))
      //     .attr('r', 6)
      //     .style('fill', pairColorScale(3))
      //     .style('stroke', d3.rgb(pairColorScale(3)).darker())
      //     .style('stroke-opacity', 0.8);

      // const groupSkewRect2 = gGroupSkew
      //         .append('rect')
      //         .attr('class', 'groupSkewRect')
      //         .attr('x', 48.5)
      //         .attr('y', 60)
      //         .attr('width', 3)
      //         .attr('height', 20)
      //         .style('fill', 'dimgray')
      //         .style('stroke', 'black')
      //         .style('stroke-width', 0.5);
  
      // const groupSkewCircle2 = gGroupSkew
      //         .append('circle')
      //         .attr('class', 'groupSkewCircle')
      //         .attr('cx', 50)
      //         .attr('cy', 80)
      //         .attr('r', 6)
      //         .style('fill', pairColorScale(1))
      //         .style('stroke', d3.rgb(pairColorScale(1)).darker())
      //         .style('stroke-opacity', 0.8);

      const groupSkewLine = gGroupSkew
            .append('line')
            .attr('x1', 0)
            .attr('y1', this.yGroupSkewScale(0))
            .attr('x2', 60)
            .attr('y2', this.yGroupSkewScale(0))
            .style('stroke', 'black')
            .style('stroke-width', 3);

      const groupSkewText = gGroupSkew
            .append('text')
            .attr('x', -10)
            .attr('y', 100)
            .text('Group skew: 1.03');
      
      return (
        <div className={styles.IndividualFairnessView}>
          <div className={styles.individualTitleWrapper}>
            <div className={index.title}>Individual Fairness</div>
            <div className={styles.sortIndividualPlot}>
              sort by: &nbsp;
              <Dropdown direction='down' className={styles.DistortionSortingDropdown} isOpen={this.state.dropdownOpen}  size="sm" toggle={this.sortDistortion}>
                <DropdownToggle caret>
                  close to far
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem value='pairwiseDistance' onClick={this.handleSelectSorting}>Pairwise distance (close to far)</DropdownItem>
                  <DropdownItem value='distortion' onClick={this.handleSelectSorting}>Distortion (small to large)</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          {this.svg.toReact()}
        </div>
      );
    }

    sortDistortion() {
      this.setState(prevState => ({
        dropdownOpen: !prevState.dropdownOpen
      }));

      console.log("dropdown selected")
    }

    handleSelectSorting(e) {
      this.setState({ sortBy: e.target.value });

      let sortBy = e.target.value,
          data = this.combinedCoordsData,
          transition = d3.transition().duration(750);

      console.log('sortBy: ', e.target.value);

      if(sortBy === 'distortion') {
        this.xObservedScale.domain(d3.extent(data, (d) => d.y1 - d.y0));

        transition.select(".indi_x_axis").call(d3.axisTop(this.xObservedScale).tickSize(0));
        d3.selectAll(".coords_circle")
                .data(data)
                .transition(transition)
                .attr("cx", (d) => this.xObservedScale(d.y1 - d.y0));

        d3.selectAll(".coords_rect")
                .data(data)
                .transition(transition)
                .attr("x", (d) => this.xObservedScale(d.y1 - d.y0));
      } else if(sortBy === 'pairwiseDistance') {
        this.xObservedScale.domain(d3.extent(data, (d) => d.x0));

        transition.select(".indi_x_axis").call(d3.axisTop(this.xObservedScale).tickSize(0));
        d3.selectAll(".coords_circle")
                .data(data)
                .transition(transition)
                .attr("cx", (d) => this.xObservedScale(d.x0));

        d3.selectAll(".coords_rect")
                .data(data)
                .transition(transition)
                .attr("x", (d) => this.xObservedScale(d.x0));
      }

      // Redefine scale
      // Assign the new scale to axis
      // Select all lines and circles, and update the coordinates according to the new scale
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
  }

  Dropdown.propTypes = {
    direction: 'down'
  }

  export default IndividualFairnessView;