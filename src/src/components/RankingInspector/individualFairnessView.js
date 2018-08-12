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

      // For legend view
      this.svgLegend;

      // For matrix view
      this.xMatrixScale;
      this.yMatrixScale;
      this.cellWidth;
      this.cellHeight;
      this.cellColorDistortionScale;
      this.sumDistortionScale;

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
          height: 150 // 100% of whole layout
        },
        svgMatrix: {
          width: 300,
          height: 300,
          margin: 10,
          matrixPlot: {
            width: 200,
            height: 200
          },
          attrPlotLeft: {
            width: 40,
            height: 200
          },
          attrPlotBottom: {
            width: 200,
            height: 30
          },
          distortionSumPlotUpper: {
            width: 200,
            height: 30
          },
          distortionSumPlotRight: {
            width: 30,
            height: 200
          }
        },
        svgPlot: {
          width: 100,
          height: 100,
          margin: 5
        },
        svgLegend: {
          width: 130,
          height: 150
        },
        groupSkew: {
          width: 55,
          height: 250
        },
        plot: {
          width: 530,
          height: 150,
          padding: 10
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
      let _self = this;

      _self.svgPlot = new ReactFauxDOM.Element('svg');

      _self.svgPlot.setAttribute('width', _self.layout.svgPlot.width);
      _self.svgPlot.setAttribute('height', _self.layout.svgPlot.height);
      _self.svgPlot.setAttribute('0 0 200 200');
      _self.svgPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svgPlot.style.setProperty('margin', '0 5%');

      let dataDiffs = this.props.diffs;

      // sort by observed space difference
      dataDiffs = _.orderBy(dataDiffs, ['observed']);

      // Coordinate scales
      this.xObservedScale2 = d3.scaleLinear()
          .domain(d3.extent(dataDiffs, (d) => d.observed))
          .range([0, this.layout.svgPlot.width - this.layout.svgPlot.margin]);
      this.yDecisionScale = d3.scaleLinear()
          .domain(d3.extent(dataDiffs, (d) => d.decision))  
          .range([this.layout.svgPlot.height, 0]);
            
      let gPlot = d3.select(this.svgPlot).append('g')
          .attr('class', 'g_plot')
          .attr('transform', 'translate(0, 0)');

      const xAxisSetting = d3.axisTop(this.xObservedScale2).tickSize(0).ticks(0),
            yAxisSetting = d3.axisRight(this.yDecisionScale).tickSize(0).ticks(0),
            xAxis = gPlot.append('g')
                .call(xAxisSetting)
                .attr('class', 'indi_x_axis')
                .attr('transform', 'translate(' + this.layout.svgPlot.margin + ',' + (this.layout.svgPlot.height - this.layout.svgPlot.margin) + ')'),
            yAxis = gPlot.append('g')
                .call(yAxisSetting)
                .attr('class', 'indi_y_axis')
                .attr('transform', 'translate(0,0)');

      const coordsCircles = gPlot
            .selectAll('.plot_circle')
            .data(dataDiffs)
            .enter().append('circle')
            .attr('class', (d) => {
              let groupClass;

              if(d.pair === 1)
                groupClass = 'plot_circle_group1';
              else if(d.pair === 2)
                groupClass = 'plot_circle_group2';
              else
                groupClass = 'plot_circle_betweenGroup';

              return 'plot_circle ' + groupClass;
            })
            .attr('cx', (d) => this.xObservedScale2(d.observed))
            .attr('cy', (d) => this.yDecisionScale(d.decision))
            .attr('r', 1)
            .style('fill', (d) => this.pairColorScale(d.pair))
            .style('stroke', (d) => d3.rgb(this.pairColorScale(d.pair)).darker())
            .style('opacity', 0.8)
            .style('stroke-opacity', 0.8);
    }

    renderMatrix() {
      let _self = this;

      _self.svgMatrix = new ReactFauxDOM.Element('svg');
  
      _self.svgMatrix.setAttribute('width', _self.layout.svgMatrix.width);
      _self.svgMatrix.setAttribute('height', _self.layout.svgMatrix.height);
      _self.svgMatrix.setAttribute('0 0 200 200');
      _self.svgMatrix.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svgMatrix.style.setProperty('margin', '0 5%');

      let dataDistortions = this.props.diffs,
          dataDistortionsForMatrix = this.props.diffsInPermutations,
          dataInputs = this.props.inputCoords,
          dataObservedAndDecisions = this.props.dataObservedAndDecisions,
          distortionMin = d3.extent(dataDistortionsForMatrix, (d) => Math.abs(d.observed - d.decision))[0],
          distortionMax = d3.extent(dataDistortionsForMatrix, (d) => Math.abs(d.observed - d.decision))[1];

      dataInputs = this.calculateTotalSum(dataInputs);
      
      _self.xMatrixScale = d3.scaleBand()
          .domain(_.map(dataInputs, (d) => d.idx))  // For now, it's just an index of items(from observed)
          .range([0, _self.layout.svgMatrix.matrixPlot.width]),
      _self.yMatrixScale = d3.scaleBand()
          .domain(_.map(dataInputs, (d) => d.idx))  // For now, it's just an index of items(from observed)
          .range([_self.layout.svgMatrix.matrixPlot.height, 0]),
      _self.cellWidth = _self.xMatrixScale.bandwidth(),
      _self.cellHeight = _self.yMatrixScale.bandwidth(),
      _self.cellColorDistortionScale = d3.scaleLinear()
              .domain([distortionMin, (distortionMin+distortionMax)/2, distortionMax])
              .range(['slateblue', 'white', 'PALEVIOLETRED']),
      _self.sumDistortionScale = d3.scaleLinear()
              .domain([0, 1])
              .range([5, _self.layout.svgMatrix.distortionSumPlotRight.width - 10]),
      _self.yAttributeScale = d3.scaleLinear()
          .domain([0, 1])
          .range(['white', '#5598b7']);

      let gMatrix = d3.select(_self.svgMatrix).append('g')
              .attr('class', 'g_matrix')
              .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',' + _self.layout.svgMatrix.distortionSumPlotUpper.height + ')'),
          gCells = gMatrix.selectAll('.g_row')
              .data(dataDistortionsForMatrix)
              .enter().append('g')
              .attr('class', 'g_row')
              .attr('transform', function(d){
                return 'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')';
              }),
          gAttrPlotLeft = d3.select(_self.svgMatrix).append('g')
              .attr('class', 'g_attr_plot_x')
              .attr('transform', 'translate(0,' + _self.layout.svgMatrix.distortionSumPlotUpper.height + ')'),
          gAttrPlotBottom = d3.select(_self.svgMatrix).append('g')
              .attr('class', 'g_attr_plot_y')
              .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',' + 
                                                (_self.layout.svgMatrix.matrixPlot.height + _self.layout.svgMatrix.distortionSumPlotUpper.height) + ')'),
          gDistortionSumPlotRight = d3.select(_self.svgMatrix).append('g')
              .attr('class', 'g_distortion_plot_right')
              .attr('transform', 'translate(' + (_self.layout.svgMatrix.attrPlotLeft.width + _self.layout.svgMatrix.matrixPlot.width + 35) + ',' + 
                                                _self.layout.svgMatrix.distortionSumPlotUpper.height + ')');

      // For Matrix plot
      gCells.append('rect')
          .attr('class', 'pair_rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', _self.cellWidth)
          .attr('height', _self.cellHeight)
          .style('fill', (d) => {
            const distortion = Math.abs(d.observed - d.decision),
                  distortionMin = _self.cellColorDistortionScale.domain()[0],
                  distortionMax = _self.cellColorDistortionScale.domain()[1],
                  distortionInterval = distortionMax - distortionMin,
                  fairThreshold = _self.cellColorDistortionScale.domain()[0] + distortionInterval * 0.05,
                  outlierThreshold = _self.cellColorDistortionScale.domain()[1] - 0.000000000000000000000000000000000000000000000005;
          
            let fillColor = _self.cellColorDistortionScale(Math.abs(d.observed - d.decision));
            
            if(distortion < fairThreshold) {
              fillColor = 'blue';
            } else if (distortion > outlierThreshold) {
              fillColor = 'red';
            }
            
            return _self.cellColorDistortionScale(Math.abs(d.observed - d.decision));
          })
          .style('stroke', (d) => {
            const distortion = Math.abs(d.observed - d.decision),
                  distortionMin = _self.cellColorDistortionScale.domain()[0],
                  distortionMax = _self.cellColorDistortionScale.domain()[1],
                  distortionInterval = distortionMax - distortionMin,
                  fairThreshold = _self.cellColorDistortionScale.domain()[0] + distortionInterval * 0.05,
                  outlierThreshold = _self.cellColorDistortionScale.domain()[1] - distortionInterval * 0.05;
            let strokeColor = 'white';
            
            if(distortion < fairThreshold) {
              strokeColor = 'red';
            } else if (distortion > outlierThreshold) {
              strokeColor = 'blue';
            }

            return 'black';
          })
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

      // For Attribute plot on the left
      gAttrPlotLeft.selectAll('.attr_rect_left')
          .data(dataInputs)
          .enter().append('rect')
          .attr('class', 'attr_rect_left')
          .attr('x', 0)
          .attr('y', (d) => _self.yMatrixScale(d.idx))
          .attr('width', 5)
          .attr('height', _self.cellHeight)
          .attr('fill', (d) => _self.yAttributeScale(Math.random()))
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

      gAttrPlotLeft.selectAll('.pair_rect_left')
          .data(dataInputs)
          .enter().append('rect')
          .attr('class', 'pair_rect_left')
          .attr('x', 30)
          .attr('y', (d) => _self.yMatrixScale(d.idx))
          .attr('width', 3)
          .attr('height', _self.cellHeight)
          .attr('fill', (d) => {
            return d.sex === 'female '? gs.groupColor1 : gs.groupColor2;
          })
          .attr('stroke', 'black')
          .attr('shape-rendering', 'crispEdge')
          .attr('stroke-width', 0.5);

      // For distortion sum plot on the right
      gAttrPlotLeft.selectAll('.sum_distortion_rect_right')
          .data(dataInputs)
          .enter().append('rect')
          .attr('class', 'sum_distortion_rect_right')
          .attr('x', (d) => 30 - _self.sumDistortionScale(d.sumDistortion))
          .attr('y', (d) => _self.yMatrixScale(d.idx) + _self.cellHeight / 2)
          .attr('width', (d) => _self.sumDistortionScale(d.sumDistortion))
          .attr('height', 0.5)
          .attr('fill', (d) => {
            return d.sex === 'female '? gs.groupColor1 : gs.groupColor2;
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2);

      gAttrPlotLeft.selectAll('.sum_distortion_circle_right')
          .data(dataInputs)
          .enter().append('circle')
          .attr('class', 'sum_distortion_circle_right')
          .attr('cx', (d) => 30 - _self.sumDistortionScale(d.sumDistortion))
          .attr('cy', (d) => _self.yMatrixScale(d.idx) + _self.cellHeight / 2)
          .attr('r', 2)
          .attr('fill', (d) => {
            return d.sex === 'female '? gs.groupColor1 : gs.groupColor2;
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2);
    }

    renderLegend() {
      let _self = this;

      _self.svgLegend = new ReactFauxDOM.Element('svg');
  
      _self.svgLegend.setAttribute('width', _self.layout.svgLegend.width);
      _self.svgLegend.setAttribute('height', _self.layout.svgLegend.height);
      _self.svgLegend.setAttribute('0 0 200 200');
      _self.svgLegend.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svgLegend.style.setProperty('margin', '30px 0px 5%');
      
      const gLegend = d3.select(_self.svgLegend).append('g')
              .attr('class', 'g_legend')
              .attr('transform', 'translate(0, 0)');

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
          .style('fill', _self.pairColorScale(3))
          .style('stroke', d3.rgb(_self.pairColorScale(3)).darker());
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
          .style('fill', _self.pairColorScale(1))
          .style('stroke', d3.rgb(_self.pairColorScale(1)).darker());
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
          .style('fill', _self.pairColorScale(2))
          .style('stroke', d3.rgb(_self.pairColorScale(2)).darker())
          .on('mouseover', (d) => {
              // Interact with svgPlot
              const svgPlot = d3.select('.svg_legend');

              svgPlot.selectAll('circle.coords_circle_group2')
                .style('stroke', 'black')
                .style('stroke-width', 2);

              svgPlot.selectAll('.coords_rect')
                .style('opacity', 0.2);

              svgPlot.select('.g_plot')
                .append('line')
                .attr('class', 'group_fitting_line')
                .attr('x1', 0)
                .attr('y1', 200)
                .attr('x2', 540)
                .attr('y2', 180)
                .style('stroke', _self.pairColorScale(2))
                .style('stroke-width', 3);
          })
          .on('mouseout', (d) => {
              // Interact with svgPlot
              const svgPlot = d3.select('.svg_legend');

              svgPlot.selectAll('circle.coords_circle_group2')
                .style('stroke', d3.rgb(_self.pairColorScale(2)).darker())
                .style('stroke-width', 1);

              svgPlot.selectAll('.coords_rect')
                .style('opacity', 1);

              svgPlot.select('.group_fitting_line').remove();
          })
      gLegend.append('text')
          .attr('x', 30)
          .attr('y', 63)
          .text('Woman-Woman')
          .style('font-size', '11px');  
    }

    sortDistortion() {
      this.setState(prevState => ({
        dropdownOpen: !prevState.dropdownOpen
      }));
    }

    handleSelectSorting(e) {
      let _self = this;

      this.setState({ sortBy: e.target.value });

      let sortBy = e.target.value,
          data = this.combinedCoordsData,
          transition = d3.transition().duration(750);

      if(sortBy === 'distortion') {
        _self.xObservedScale.domain(d3.extent(data, (d) => d.y1 - d.y0));

        transition.select('.indi_x_axis').call(d3.axisTop(_self.xObservedScale).tickSize(0));
        d3.selectAll('.coords_circle')
                .data(data)
                .transition(transition)
                .attr('cx', (d) => _self.xObservedScale(d.y1 - d.y0));

        d3.selectAll('.coords_rect')
                .data(data)
                .transition(transition)
                .attr('x', (d) => _self.xObservedScale(d.y1 - d.y0));
      } else if(sortBy === 'pairwiseDistance') {
        _self.xObservedScale.domain(d3.extent(data, (d) => d.x0));

        transition.select('.indi_x_axis').call(d3.axisTop(_self.xObservedScale).tickSize(0));
        d3.selectAll('.coords_circle')
                .data(data)
                .transition(transition)
                .attr('cx', (d) => _self.xObservedScale(d.x0));

        d3.selectAll('.coords_rect')
                .data(data)
                .transition(transition)
                .attr('x', (d) => _self.xObservedScale(d.x0));
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

    calculateTotalSum(dataInputs) {
      _.forEach(dataInputs, (d, i) => {
        dataInputs[i].sumDistortion = Math.random();
      });

      return dataInputs;
    }
  
    render() {
      let _self = this;

      _self.svg = new ReactFauxDOM.Element('svg');
  
      _self.svg.setAttribute('width', _self.layout.svg.width);
      _self.svg.setAttribute('height', _self.layout.svg.height);
      _self.svg.setAttribute('0 0 200 200');
      _self.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svg.style.setProperty('margin', '0 10px');
  
      let data = _self.props.distortions;

      // sort by observed space difference
      data = _.orderBy(data, ['observed']);
  
      const coords = _self.calculateCoords(_self.layout.plot.width, data.length, data),
            baselineCoords = _self.calculateBaselineCoords(_self.layout.plot.width, data.length, data);

      // Coordinate scales
      _self.xObservedScale = d3.scaleLinear()
            .range([0, _self.layout.plot.width])
            .domain([0, d3.max(coords, (d) => d.x)]),
      _self.yDistortionScale = d3.scaleLinear()
            .range([_self.layout.plot.height - _self.layout.plot.padding, _self.layout.plot.padding])
            .domain(d3.extent(coords, (d) => d.y)),
      _self.xGroupSkewScale = d3.scaleBand()
            .range([0, _self.layout.groupSkew.width])
            .domain([0, 1, 2, 3, 4]);
      _self.yGroupSkewScale = d3.scaleLinear()
            .range([_self.layout.plot.height - 5, 0])
            .domain([-10, 10]);

      const gPlot = d3.select(_self.svg).append('g')
              .attr('class', 'g_plot')
              .attr('transform', 'translate(0, 0)'),
            gViolinPlot = gPlot.append('g')
              .attr('class', 'g_violin_plot')
              .attr('transform', 'translate(570, 0)'),
            gGroupSkew = gPlot.append('g')
              .attr('transform', 'translate(650, 0)');

      const xAxisSetting = d3.axisTop(_self.xObservedScale).tickSize(0).ticks(0),
            yAxisSetting = d3.axisRight(_self.yDistortionScale).tickSize(0).ticks(0),
            xAxisGroupSkewSetting = d3.axisTop(_self.xObservedScale).tickSize(0).ticks(0),
            yAxisGroupSkewSetting = d3.axisLeft(_self.yGroupSkewScale).tickSize(0).ticks(0),

            xAxis = gPlot.append('g')
              .call(xAxisSetting)
              .attr('class', 'indi_x_axis')
              .attr('transform', 'translate(0,' + _self.yDistortionScale(0) + ')'),
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
              .attr('y1', _self.yDistortionScale(0))
              .attr('x2', 70)
              .attr('y2', _self.yDistortionScale(0))
              .style('stroke-dasharray', '3,3')
              .style('stroke', 'lightgray')
              .style('stroke-width', 3),
            yAxisGroupSkewLine = yAxisGroupSkew.select('path')
              .style('stroke-width', 3);
            

      const renameBaselineCoords = _.map([...baselineCoords], (d) => 
                _.rename(_.rename(d, 'x', 'x0'), 'y', 'y0')),
            renameCoords       = _.map([...coords], (d) => 
                _.rename(_.rename(d, 'x', 'x1'), 'y', 'y1'));
  
      _self.combinedCoordsData = _.map(renameBaselineCoords, function(d){
          return _.merge(
              d, 
              _.find(renameCoords, {idx: d.idx})
          )
      });

      // Color scales
      _self.rectColorScale = d3.scaleLinear()
            .domain(d3.extent(_self.combinedCoordsData, (d) => d.y1 - d.y0))
            .range(['lightgreen', 'pink']),
      _self.pairColorScale = d3.scaleThreshold()
            .domain([1, 2, 3])  // pair is one or two or three
            .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor]);      

      _self.renderMatrix();
      _self.renderPlot();
      _self.renderLegend();

      const margin = 20,
            outLierMargin = 5;

      const marginRect = gPlot
                .append('rect')
                .attr('class', 'margin_rect')
                .attr('x', 0)
                .attr('y', _self.yDecisionScale(0) - (outLierMargin/2))
                .attr('width', _self.layout.plot.width)
                .attr('height', margin * 2)
                .style('fill', 'lightblue')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('lightgreen').darker())
                .style('stroke-dasharray', '2, 2'),
            outLierMarginRect = gPlot
                .append('rect')
                .attr('class', 'margin_rect')
                .attr('x', 0)
                .attr('y', _self.layout.plot.margin)
                .attr('width', _self.layout.plot.width)
                .attr('height', outLierMargin * 2)
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2'),
            outLierMarginRect2 = gPlot
                .append('rect')
                .attr('class', 'margin_rect')
                .attr('x', 0)
                .attr('y', _self.layout.plot.height - outLierMargin)
                .attr('width', _self.layout.plot.width)
                .attr('height', outLierMargin * 2)
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2');

      const rects = gPlot
              .selectAll('.coords_rect')
              .data(_self.combinedCoordsData)
              .enter().append('rect')
              .attr('class', 'coords_rect')
              .attr('x', (d) => _self.xObservedScale(d.x0))
              .attr('y', (d) => 
                  d.y1 - d.y0 > 0
                  ? _self.yDistortionScale(d.y1 - d.y0) 
                  : _self.yDistortionScale(d.y0)
              )
              .attr('width', 0.05)
              .attr('height', (d) => Math.abs(_self.yDistortionScale(d.y1 - d.y0) - _self.layout.plot.height * 3/4))
              .style('stroke', 'gray')
              //.style('shape-rendering', 'crispEdge')
              .style('stroke-dasharray', '3,3')
              .style('stroke-width', 0.3);
  
      const coordsCircles = gPlot
              .selectAll('.coords_circle')
              .data(_self.combinedCoordsData)
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
              .attr('cx', (d) => _self.xObservedScale(d.x0))
              .attr('cy', (d) => _self.yDistortionScale(d.y1))
              .attr('r', 3)
              .style('fill', (d) => _self.pairColorScale(d.pair))
              .style('stroke', (d) => 'black')
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
                      .append('path')
                      .attr('class', 'mouseoverPairColor mouseoverPairCircleRight')
                      .attr('d', circleArc)
                      .attr('transform', function(e) {
                        return 'translate(' + (_self.xObservedScale(d.x0) - 1) + ',' + _self.yDistortionScale(d.y1) + ')' + 'rotate(180)'
                      })
                      .style('stroke', (e) => d3.rgb(_self.pairColorScale(d.pair)).darker())
                      .style('fill', (e) => _self.pairColorScale(d.pair));

                    // right semicircle
                    d3.select('.g_plot')
                      .append('path')
                      .attr('class', 'mouseoverPairColor mouseoverPairCircleRight')
                      .attr('d', circleArc)
                      .attr('transform', function(e) {
                        return 'translate(' + (_self.xObservedScale(d.x0) + 1) + ',' + _self.yDistortionScale(d.y1) + ')' + 'rotate(0)'
                      })
                      .style('stroke', (e) => {
                        return d3.rgb(_self.pairColorScale(d.pair)).darker()
                      })
                      .style('fill', (e) => _self.pairColorScale(d.pair));
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
              .data(_.filter(_self.combinedCoordsData, (d) => d.pair === 1).slice(0, 50))
              .distributeOn((d) => _self.yDistortionScale(d.y1))
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
        .style('fill', (bee) => _self.pairColorScale(bee.datum.pair))
        .style('stroke', (bee) => d3.rgb(_self.pairColorScale(bee.datum.pair)).darker());

      const swarm2 = beeswarm()
              .data(_.filter(_self.combinedCoordsData, (d) => d.pair === 2).slice(0, 50))
              .distributeOn((d) => _self.yDistortionScale(d.y1))
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
          .style('fill', (bee) => _self.pairColorScale(bee.datum.pair))
          .style('stroke', (bee) => d3.rgb(_self.pairColorScale(bee.datum.pair)).darker());
      
      const swarm3 = beeswarm()
            .data(_.filter(_self.combinedCoordsData, (d) => d.pair === 3).slice(0, 50))
            .distributeOn((d) => _self.yDistortionScale(d.y1))
            .radius(2)
            .orientation('vertical')
            .side('symmetric')
            .arrange();

      gViolinPlot.selectAll('.beeswarm_circle3')
          .data(swarm3)
          .enter()
          .append('circle')
          .attr('class', 'beeswarm_circle3')
          .attr('cx', function(bee) {
            return bee.x + 60;
          })
          .attr('cy', function(bee) {
            return bee.y;
          })
          .attr('r', 3)
          .style('fill', (bee) => _self.pairColorScale(bee.datum.pair))
          .style('stroke', (bee) => d3.rgb(_self.pairColorScale(bee.datum.pair)).darker());

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
            .attr('x', _self.xGroupSkewScale(idx))
            .attr('y', (d) => 
              sumSkew > 0
                ? _self.yGroupSkewScale(sumSkew) 
                : _self.yGroupSkewScale(0)
            )
            .attr('width', idx)
            .attr('height', Math.abs(_self.yGroupSkewScale(sumSkew) - _self.yGroupSkewScale(0)))
            .style('fill', _self.pairColorScale(idx))
            .style('stroke', 'black')
            .style('stroke-width', 0.5);

        gGroupSkew
            .append('circle')
            .attr('class', 'groupSkewCircle')
            .attr('cx', _self.xGroupSkewScale(idx))
            .attr('cy', _self.yGroupSkewScale(sumSkew))
            .attr('r', 6)
            .style('fill', _self.pairColorScale(idx))
            .style('stroke', d3.rgb(_self.pairColorScale(idx)).darker())
            .style('stroke-opacity', 0.8);
        
        idx++;
      });

      const groupSkewLine = gGroupSkew
            .append('line')
            .attr('x1', 0)
            .attr('y1', _self.yGroupSkewScale(0))
            .attr('x2', 60)
            .attr('y2', _self.yGroupSkewScale(0))
            .style('stroke', 'black')
            .style('stroke-width', 3);

      const groupSkewText = gGroupSkew
            .append('text')
            .attr('x', -10)
            .attr('y', 10)
            .text('Group skew: 1.03');
      
      return (
        <div className={styles.IndividualFairnessView}>
          <div className={index.title + ' ' + styles.individualFairnessViewTitle}>Distortions</div>
          <div className={styles.IndividualFairnessViewBar}>
            sort by: &nbsp;
            <Dropdown direction='down' className={styles.DistortionSortingDropdown} isOpen={this.state.dropdownOpen}  size='sm' toggle={this.sortDistortion}>
              <DropdownToggle caret>
                close to far
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem value='pairwiseDistance' onClick={this.handleSelectSorting}>Pairwise distance (close to far)</DropdownItem>
                <DropdownItem value='distortion' onClick={this.handleSelectSorting}>Distortion (small to large)</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <div className={styles.MatrixView}> 
            <div className={index.subTitle}>Individual Distortions</div>
            {this.svgMatrix.toReact()} 
          </div>
          <div className={styles.Legend}>
            <div> {this.svgLegend.toReact()} </div>
            {this.svgPlot.toReact()}
          </div>
          <div className={styles.DistortionPlot}> 
            <div className={index.subTitle}>Pairwise Distortions</div>
            {this.svg.toReact()}
          </div>
        </div>
      );
    }
  }

  Dropdown.propTypes = {
    direction: 'down'
  }

  export default IndividualFairnessView;