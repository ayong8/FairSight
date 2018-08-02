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
      this.yDistortionScale;
      this.xGroupSkewScale;
      this.yGroupSkewScale;
      this.rectColorScale;
      this.pairColorScale;

      this.xObservedScale2;
      this.yDecisionScale;

      this.state = {
        dropdownOpen: false,
        sortBy: 'close to far'
      };

      this.svg;
      this.svgMatrix;
      this.svgPlot;
      this.layout = {
        width: 650,
        height: 300,
        svg: {
          width: 750, // 90% of whole layout
          height: 250 // 100% of whole layout
        },
        svgMatrix: {
          width: 400,
          height: 400,
          margin: 10
        },
        svgPlot: {
          width: 100,
          height: 100,
          margin: 5
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

    renderPlot() {
      let self = this;

      this.svgPlot = new ReactFauxDOM.Element('svg');
  
      this.svgPlot.setAttribute('width', this.layout.svgPlot.width);
      this.svgPlot.setAttribute('height', this.layout.svgPlot.height);
      this.svgPlot.setAttribute('0 0 200 200');
      this.svgPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svgPlot.style.setProperty('margin', '0 5%');

      let data = this.props.distortions;

      // sort by observed space difference
      data = _.orderBy(data, ['observed']);

      // Coordinate scales
      this.xObservedScale2 = d3.scaleLinear()
            .range([0, this.layout.svgPlot.width - this.layout.svgPlot.margin])
            .domain(d3.extent(data, (d) => d.observed));
      this.yDecisionScale = d3.scaleLinear()
            .range([this.layout.svgPlot.height - this.layout.svgPlot.margin, this.layout.svgPlot.margin])
            .domain(d3.extent(data, (d) => d.decision));

      let gPlot = d3.select(this.svgPlot).append('g')
          .attr('class', 'g_plot')
          .attr('transform', 'translate(0, 0)');

      const xAxisSetting = d3.axisTop(this.xObservedScale).tickSize(0).ticks(0),
          yAxisSetting = d3.axisRight(this.yDistortionScale).tickSize(0).ticks(0);

    }

    renderMatrix() {
      let self = this;

      this.svgMatrix = new ReactFauxDOM.Element('svg');
  
      this.svgMatrix.setAttribute('width', this.layout.svgMatrix.width);
      this.svgMatrix.setAttribute('height', this.layout.svgMatrix.height);
      this.svgMatrix.setAttribute('0 0 200 200');
      this.svgMatrix.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      this.svgMatrix.style.setProperty('margin', '0 5%');

      let dataDistortions = this.props.distortions,
          dataDistortionsForMatrix = this.props.distortionsInPermutations,
          dataInputs = this.props.inputCoords,
          dataObservedAndDecisions = this.props.dataObservedAndDecisions;
      
      let xMatrixScale = d3.scaleBand()
              .domain(_.map(dataInputs, (d) => d.idx))  // For now, it's just an index of items(from observed)
              .range([0, this.layout.svgMatrix.width - this.layout.svgMatrix.margin]),
          yMatrixScale = d3.scaleBand()
              .domain(_.map(dataInputs, (d) => d.idx))  // For now, it's just an index of items(from observed)
              .range([this.layout.svgMatrix.height - this.layout.svgMatrix.margin, 0]),
          cellWidth = xMatrixScale.bandwidth(),
          cellHeight = yMatrixScale.bandwidth(),
          circleDistortionScale = d3.scaleLinear()
              .domain(d3.extent(dataDistortionsForMatrix, (d) => Math.abs(d.observed - d.decision)))
              .range([0, cellWidth / 2]);

      console.log(circleDistortionScale.domain());

      let gMatrix = d3.select(this.svgMatrix).append('g')
          .attr("class", "g_matrix")
          .attr("transform", "translate(" + this.layout.svgMatrix.margin + "," + this.layout.svgMatrix.margin + ")");

      let gCells = gMatrix.selectAll('.g_row')
          .data(dataDistortionsForMatrix)
          .enter().append('g')
          .attr('class', 'g_row')
          .attr('transform', function(d){
            return "translate(" + xMatrixScale(d.idx1) + "," + yMatrixScale(d.idx2) + ")";
        });

      gCells.append('rect')
        .attr('class', 'pair_rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .style('fill', (d) => self.pairColorScale(d.pair))
        .style('stroke', 'white');

      gCells
        .each(function(d) {
          d3.select(this).append('circle')
            .attr('class', 'distortion_circle')
            .attr('cx', cellWidth / 2)
            .attr('cy', cellHeight / 2)
            .attr('r', (d) => {
              return circleDistortionScale(Math.abs(d.observed - d.decision));
            })
            .style('fill', 'red')
            .style('stroke', 'black');
        });
        
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

      // sort by observed space difference
      data = _.orderBy(data, ['observed']);
  
      const coords = this.calculateCoords(this.layout.plot.width, data.length, data),
            baselineCoords = this.calculateBaselineCoords(this.layout.plot.width, data.length, data);

      // Coordinate scales
      this.xObservedScale = d3.scaleLinear()
            .range([0, this.layout.plot.width])
            .domain([0, d3.max(coords, (d) => d.x)]),
      this.yDistortionScale = d3.scaleLinear()
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
            yAxisSetting = d3.axisRight(this.yDistortionScale).tickSize(0).ticks(0),
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
      this.rectColorScale = d3.scaleLinear()
            .domain(d3.extent(this.combinedCoordsData, (d) => d.y1 - d.y0))
            .range(['lightgreen', 'pink']),
      this.pairColorScale = d3.scaleThreshold()
            .domain([1, 2, 3])  // pair is one or two or three
            .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor]);      

      this.renderMatrix();
      this.renderPlot();
      
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
          .style('fill', this.pairColorScale(3))
          .style('stroke', d3.rgb(this.pairColorScale(3)).darker());
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
          .style('fill', this.pairColorScale(1))
          .style('stroke', d3.rgb(this.pairColorScale(1)).darker());
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
          .style('fill', this.pairColorScale(2))
          .style('stroke', d3.rgb(this.pairColorScale(2)).darker())
          .on('mouseover', (d) => {
              d3.selectAll('circle.coords_circle_group2')
                .style('stroke', 'black')
                .style('stroke-width', 2);

              d3.selectAll('.coords_rect')
                .style('opacity', 0.2);

              d3.select('.g_plot')
                .append('line')
                .attr('class', 'group_fitting_line')
                .attr('x1', 0)
                .attr('y1', 200)
                .attr('x2', 540)
                .attr('y2', 180)
                .style('stroke', this.pairColorScale(2))
                .style('stroke-width', 3);
          })
          .on('mouseout', (d) => {
              d3.selectAll('circle.coords_circle_group2')
                .style('stroke', d3.rgb(this.pairColorScale(2)).darker())
                .style('stroke-width', 1);

              d3.selectAll('.coords_rect')
                .style('opacity', 1);

              d3.select('.group_fitting_line').remove();
          })
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
                .style('stroke-dasharray', '2, 2'),
            outLierMarginRect = gPlot
                .append('rect')
                .attr('class', 'margin_rect')
                .attr('x', 0)
                .attr('y', (this.layout.plot.height * 2/4 - outLierMargin))
                .attr('width', this.layout.plot.width)
                .attr('height', outLierMargin * 2)
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2'),
            outLierMarginRect2 = gPlot
                .append('rect')
                .attr('class', 'margin_rect')
                .attr('x', 0)
                .attr('y', (this.layout.plot.height * 4/4 - outLierMargin - 5))
                .attr('width', this.layout.plot.width)
                .attr('height', outLierMargin * 2)
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2');

      const rects = gPlot
              .selectAll('.coords_rect')
              .data(this.combinedCoordsData)
              .enter().append('rect')
              .attr('class', 'coords_rect')
              .attr('x', (d) => this.xObservedScale(d.x0))
              .attr('y', (d) => 
                  d.y1 - d.y0 > 0
                  ? this.yDistortionScale(d.y1 - d.y0) 
                  : this.yDistortionScale(d.y0)
              )
              .attr('width', 0.05)
              .attr('height', (d) => Math.abs(this.yDistortionScale(d.y1 - d.y0) - this.layout.plot.height * 3/4))
              .style('stroke', 'black')
              .style('stroke-width', 0.5);
  
      const coordsCircles = gPlot
              .selectAll('.coords_circle')
              .data(this.combinedCoordsData)
              .enter().append('circle')
              .attr('class', (d) => {
                let groupClass;

                if(d.pair === 1)
                  groupClass = 'coords_circle_group1';
                else if(d.pair === 2)
                  groupClass = 'coords_circle_group2';
                else
                  groupClass = 'coords_circle_betweenGroup';

                return 'coords_circle ' + groupClass;
              })
              .attr('cx', (d) => this.xObservedScale(d.x0))
              .attr('cy', (d) => this.yDistortionScale(d.y1))
              .attr('r', 3)
              .style('fill', (d) => this.pairColorScale(d.pair))
              .style('stroke', (d) => d3.rgb(this.pairColorScale(d.pair)).darker())
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
                      .style("stroke", (e) => d3.rgb(self.pairColorScale(d.pair)).darker())
                      .style("fill", (e) => self.pairColorScale(d.pair));

                    // right semicircle
                    d3.select('.g_plot')
                      .append("path")
                      .attr("class", 'mouseoverPairColor mouseoverPairCircleRight')
                      .attr("d", circleArc)
                      .attr("transform", function(e) {
                        return "translate(" + (self.xObservedScale(d.x0) + 1) + "," + self.yDecisionScale(d.y1) + ")" + "rotate(0)"
                      })
                      .style("stroke", (e) => {
                        return d3.rgb(self.pairColorScale(d.pair)).darker()
                      })
                      .style("fill", (e) => self.pairColorScale(d.pair));
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
              .distributeOn((d) => this.yDistortionScale(d.y1))
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
        .style('fill', (bee) => this.pairColorScale(bee.datum.pair))
        .style('stroke', (bee) => d3.rgb(this.pairColorScale(bee.datum.pair)).darker());

      const swarm2 = beeswarm()
              .data(_.filter(this.combinedCoordsData, (d) => d.pair === 2).slice(0, 50))
              .distributeOn((d) => this.yDistortionScale(d.y1))
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
        .style('fill', (bee) => this.pairColorScale(bee.datum.pair))
        .style('stroke', (bee) => d3.rgb(this.pairColorScale(bee.datum.pair)).darker());

      // Group skew
      const sampleGroupSkewSum = {
            groupPairs1: -3,
            groupPairs2: -5,
            betweenPairs: 8
          };
      let groupSkewRect1, groupSkewCircle1,
          idx = 1;
      
      // Go over all sum of skews
      // idx => 1: groupPairs1, 2: groupPairs2, 3: betweenPairs
      _.mapValues(sampleGroupSkewSum, (sumSkew) => {
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
            .style('fill', this.pairColorScale(idx))
            .style('stroke', 'black')
            .style('stroke-width', 0.5);

        gGroupSkew
            .append('circle')
            .attr('class', 'groupSkewCircle')
            .attr('cx', this.xGroupSkewScale(idx))
            .attr('cy', this.yGroupSkewScale(sumSkew))
            .attr('r', 6)
            .style('fill', this.pairColorScale(idx))
            .style('stroke', d3.rgb(this.pairColorScale(idx)).darker())
            .style('stroke-opacity', 0.8);
        
        idx++;
      });

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
          {this.svgPlot.toReact()}
          {this.svgMatrix.toReact()}
          {this.svg.toReact()}
        </div>
      );
    }

    sortDistortion() {
      this.setState(prevState => ({
        dropdownOpen: !prevState.dropdownOpen
      }));
    }

    handleSelectSorting(e) {
      this.setState({ sortBy: e.target.value });

      let sortBy = e.target.value,
          data = this.combinedCoordsData,
          transition = d3.transition().duration(750);

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