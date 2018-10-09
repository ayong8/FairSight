import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { beeswarm } from 'd3-beeswarm';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Checkbox, Icon, Table } from 'antd';
import regression from 'regression';

import LegendView from 'components/DistortionView/LegendView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class IndividualFairnessView extends Component {
    constructor(props) {
      super(props);

      // To calculate pairwise and permutation diffs
      this.inputScale;
      this.outputScale;

      this.combinedCoordsData = [],
      this.xObservedScale;
      this.yDistortionScale;
      this.xGroupSkewScale;
      this.yGroupSkewScale;
      this.rectColorScale;
      this.pairColorScale;

      this.xObservedScale2;
      this.yDecisionScale;

      // For matrix view
      this.xSelectedFeature = 'credit_amount'
      this.ySelectedFeature = 'age'
      this.xSortBy = 'credit_amount'
      this.ySortBy = 'age'
      this.xMatrixScale;
      this.yMatrixScale;
      this.cellWidth;
      this.cellHeight;
      this.distortionScale;
      this.absDistortionScale;
      this.sumDistortionScale;

      this.xHistoMatrixScale;
      this.yHistoMatrixScale;
      this.cellHistoWidth;
      this.cellHistoHeight;
      this.sumAbsDistortionScale;

      //this.dataPairwiseDiffs = [];
      this.dataSelectedPairwiseDiffs = [];
      this.dataPermutationDiffs = [];
      this.selectedPermutationDiffs = [];
      this.selectedPermutationDiffsFlattened = [];
      this.dataPermutationDiffsFlattened = [];

      this.dataBin = [];
      this.dataBinFlattened = [];

      this.state = {
        selectedIntervalForMatrix: {
          from: 1,
          to: 50
        },
        selectedInstances: [],
        selectedPairwiseDiffs: [],
        selectedPermutationDiffs: [],
        selectedPermutationDiffsFlattened: [],
        sortMatrixXdropdownOpen: false,
        sortMatrixYdropdownOpen: false,
        colorMatrixDropdownOpen: false,
        sortMatrixXBy: 'distortion',
        sortMatrixYBy: 'distortion',
        colorMatrixBy: 'pairwise_distortion',
        sortMatrixXdropdownValue: 'features',
        sortMatrixYdropdownValue: 'features',
        colorMatrixDropdownValue: 'Pairwise distortion',
        featureCorrSelections: [ { feature_set: '1 and 2', corr: 0.6 }, { feature_set: '1 and 2', corr: 0.6 } ]
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
          width: 500,
          height: 400,
          margin: 10,
          matrixPlot: {
            width: 300,
            height: 300
          },
          attrPlotLeft: {
            width: 40,
            height: 300
          },
          attrPlotBottom: {
            width: 300,
            height: 30
          },
          distortionSumPlotUpper: {
            width: 300,
            height: 50
          },
          distortionSumPlotRight: {
            width: 50,
            height: 300
          },
          histoMatrix: {
            width: 100,
            height: 100
          }
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
          width: 350,
          height: 150,
          padding: 10
        }
      };

      this.toggleMatrixX = this.toggleMatrixX.bind(this);
      this.toggleMatrixY = this.toggleMatrixY.bind(this);
      this.toggleMatrixColor = this.toggleMatrixColor.bind(this);
      this.handleSortingMatrixX = this.handleSortingMatrixX.bind(this);
      this.handleSortingMatrixY = this.handleSortingMatrixY.bind(this);
      this.handleColoringMatrix = this.handleColoringMatrix.bind(this);
      this.handleSelectGroupCheckbox = this.handleSelectGroupCheckbox.bind(this);
      this.handleSelectOutlierAndFairCheckbox = this.handleSelectOutlierAndFairCheckbox.bind(this);
    }

    componentWillMount() {
    }

    componentDidMount() {
      const _self = this;

      _self.setState({
        sortMatrixXBy: 'ranking',
        sortMatrixYBy: 'ranking',
        sortMatrixXdropdownValue: 'ranking',
        sortMatrixYdropdownValue: 'ranking'
      });
    }

    componentWillUpdate() {
      // this.updateMatrix();
    }

    toggleMatrixX() {
      this.setState({
        sortMatrixXdropdownOpen: !this.state.sortMatrixXdropdownOpen
      });
    }

    toggleMatrixY() {
      this.setState({
        sortMatrixYdropdownOpen: !this.state.sortMatrixYdropdownOpen
      });
    }

    toggleMatrixColor() {
      this.setState({
        colorMatrixDropdownOpen: !this.state.colorMatrixDropdownOpen
      });
    }

    handleSortingMatrixX(e) {
      const _self = this;

      const sortMatrixXBy = e.target.value,
            { data } = this.props,
            { selectedInstances, selectedPermutationDiffsFlattend } = this.props;

      const sortedX = _.sortBy(selectedInstances, 
                (sortMatrixXBy === 'sumDistortion') ? sortMatrixXBy 
                : (sortMatrixXBy === 'ranking') ? sortMatrixXBy 
                : 'features.'+ sortMatrixXBy
              );
      
      _self.xMatrixScale.domain(
          _.map(sortedX, (d) => d.ranking));
      _self.xAttributeScale.domain(
          d3.extent(selectedInstances, (d) => 
            (sortMatrixXBy === 'sumDistortion') ? d.sumDistortion
            : (sortMatrixXBy === 'ranking') ? d.ranking
            : d.features[sortMatrixXBy]
          ));

      this.setState({ 
        sortMatrixXBy: e.target.value,
        sortMatrixXdropdownValue: sortMatrixXBy
      });

      // For matrix cells
      d3.selectAll('.g_cell')
          .data(selectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .attr('transform', (d) =>
            'translate(' + _self.xMatrixScale(d.ranking1) + ',' + _self.yMatrixScale(d.ranking2) + ')'
          );

      // Bottom
      // For Attribute plot on the bottom
      d3.selectAll('.attr_rect_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.ranking))
          .attr('fill', (d) => 
            (sortMatrixXBy === 'sumDistortion') ? _self.xAttributeScale(d.sumDistortion)
            : (sortMatrixXBy === 'ranking') ? _self.xAttributeScale(d.ranking)
            : _self.xAttributeScale(d.features[sortMatrixXBy])
          );

      d3.selectAll('.pair_rect_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.ranking));

      // For sum distortion plot on the bottom
      d3.selectAll('.sum_distortion_rect_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.ranking) + _self.cellWidth / 2);

      d3.selectAll('.sum_distortion_circle_bottom')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('cx', (d) => _self.xMatrixScale(d.ranking) + _self.cellWidth / 2);

      //this.props.onCalculateNDM(this.selectedPermutationDiffs);
    }

    handleSortingMatrixY(e) {
      const _self = this;

      const sortMatrixYBy = e.target.value,
            { data } = this.props,
            { selectedInstances, selectedPermutationDiffsFlattend } = this.props;

      const sortedY = _.sortBy(selectedInstances, 
              (sortMatrixYBy === 'sumDistortion') ? sortMatrixYBy 
              : (sortMatrixYBy === 'ranking') ? sortMatrixYBy 
              : 'features.'+ sortMatrixYBy
            );
      
      _self.yMatrixScale.domain(
          _.map(sortedY, (d) => d.ranking));
      _self.yAttributeScale.domain(
            d3.extent(selectedInstances, (d) => 
              (sortMatrixYBy === 'sumDistortion') ? d.sumDistortion
              : (sortMatrixYBy === 'ranking') ? d.ranking
              : d.features[sortMatrixYBy]
          ));

      this.setState({ 
        sortMatrixYBy: e.target.value,
        sortMatrixYdropdownValue: sortMatrixYBy
      });

      d3.selectAll('.g_cell')
          .data(selectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .attr('transform', (d) =>
            'translate(' + _self.xMatrixScale(d.ranking1) + ',' + _self.yMatrixScale(d.ranking2) + ')'
          );

      // Bottom
      // For Attribute plot on the bottom
      d3.selectAll('.attr_rect_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.ranking))
          .attr('fill', (d) => 
            (sortMatrixYBy === 'sumDistortion') ? _self.yAttributeScale(d.sumDistortion)
            : (sortMatrixYBy === 'ranking') ? _self.yAttributeScale(d.ranking)
            : _self.yAttributeScale(d.features[sortMatrixYBy])
          );

      d3.selectAll('.pair_rect_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.ranking));

      // For sum distortion plot on the bottom
      d3.selectAll('.sum_distortion_rect_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.ranking) + _self.cellWidth / 2);

      d3.selectAll('.sum_distortion_circle_left')
          .data(selectedInstances)
          .transition()
          .duration(750)
          .attr('cy', (d) => _self.yMatrixScale(d.ranking) + _self.cellWidth / 2);
      
      //this.props.onCalculateNDM(this.selectedPermutationDiffsFlattend);
    }

    handleColoringMatrix(e) {
      const _self = this;

      const colorMatrixBy = e.target.value,
            { data } = this.props,
            { selectedInstances, selectedPermutationDiffsFlattend } = this.props;

      this.setState({ 
        colorMatrixYBy: colorMatrixBy,
        colorMatrixDropdownValue: colorMatrixBy
      });

      if (colorMatrixBy === 'pairwise_distortion') {
        d3.selectAll('.pair_rect')
          // .data(selectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .style('fill', (d) => {
            if (d.pair === 3)
              return _self.absDistortionBtnPairsScale(d.absDistortion);
            else
              return _self.absDistortionWtnPairsScale(d.absDistortion);
          });
      } else if (colorMatrixBy === 'pairwise_distortion') {
        d3.selectAll('.pair_rect')
          // .data(selectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .style('fill', (d) => {
              return _self.absDistortionBtnPairsScale(d.absDistortion);
          });
      }
    }

    renderMatrixXDropdownSelections() {
      const { data } = this.props,
            { features } = data;

      const featureNames = features
              .map((d) => d.name)
              .concat('sumDistortion', 'ranking');

      return featureNames.map((feature, idx) => 
          (<DropdownItem
              key={idx}
              value={feature} 
              onClick={this.handleSortingMatrixX}>
              {feature}
          </DropdownItem>));
    }

    renderMatrixYDropdownSelections() {
      const { data } = this.props,
            { features } = data;

      const featureNames = features
              .map((d) => d.name)
              .concat('sumDistortion', 'ranking');

      return featureNames.map((feature, idx) => 
          (<DropdownItem 
              key={idx}
              value={feature} 
              onClick={this.handleSortingMatrixY}>
              {feature}
          </DropdownItem>));
    }

    renderMatrixColorDropdownSelections() {
      const matrixColorOptions = [ 'pairwise_distortion', 'bewteen_within_group_pairs' ];

      return matrixColorOptions.map((option, idx) => 
          (<DropdownItem
              key={idx}
              value={option} 
              onClick={this.handleColoringMatrix}>
              {option}
          </DropdownItem>));
    }

    renderMatrix() {
      const _self = this;

      _self.svgMatrix = new ReactFauxDOM.Element('svg');
  
      _self.svgMatrix.setAttribute('width', _self.layout.svgMatrix.width);
      _self.svgMatrix.setAttribute('height', _self.layout.svgMatrix.height);
      _self.svgMatrix.setAttribute('0 0 200 200');
      _self.svgMatrix.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svgMatrix.setAttribute('class', 'svg_matrix');
      _self.svgMatrix.style.setProperty('margin', '10px 5%');

      const { data, topk, selectedInstance, selectedInstances,
              selectedPermutationDiffsFlattend, permutationDiffs, permutationDiffsFlattened } = this.props,
            { instances } = data,
            to = selectedInstances.length,
            distortionMin = d3.extent(permutationDiffsFlattened, (d) => d.distortion)[0],
            distortionMax = d3.extent(permutationDiffsFlattened, (d) => d.distortion)[1];

      let dataX = instances,
          dataY = instances,
          dataSelectedX = selectedInstances,
          dataSelectedY = selectedInstances;

      const nDataPerAxis = this.props.n,  // # of data points per axis
            nBinPerAxis = 10,             // nBinPerAxis == nXBin == nYBin
            nDataPerBin = Math.round(nDataPerAxis / nBinPerAxis);

      for (let i=0; i<nBinPerAxis; i++) {
        _self.dataBin[i] = [];
        for (let j=0; j<nBinPerAxis; j++) {
          _self.dataBin[i][j] = {};
          _self.dataBin[i][j].sumAbsDistortion = 0;
          _self.dataBin[i][j].idx1 = i;
          _self.dataBin[i][j].idx2 = j;

          for (let k=i*nDataPerBin; k<(i+1)*nDataPerBin; k++) {
            for (let l=j*nDataPerBin; l<(j+1)*nDataPerBin; l++) {
              _self.dataBin[i][j].sumAbsDistortion += permutationDiffs[k][l].absDistortion;
            }
          }
        }
      }

      _self.dataBinFlattened = _.flatten(_self.dataBin);
      _self.xMatrixScale = d3.scaleBand()
          .domain(_.map(dataSelectedX, (d) => d.ranking))  // For now, it's just an index of items(from observed)
          .range([0, _self.layout.svgMatrix.matrixPlot.width]);
      _self.yMatrixScale = d3.scaleBand()
          .domain(_.map(dataSelectedY, (d) => d.ranking))  // For now, it's just an index of items(from observed)
          .range([_self.layout.svgMatrix.matrixPlot.height + _self.layout.svgMatrix.distortionSumPlotUpper.height, 
                  _self.layout.svgMatrix.distortionSumPlotUpper.height]);
      _self.cellWidth = _self.xMatrixScale.bandwidth();
      _self.cellHeight = _self.yMatrixScale.bandwidth();
      _self.distortionScale = d3.scaleLinear()
          .domain([distortionMin, (distortionMin + distortionMax)/2, distortionMax])
          .range(['slateblue', 'white', 'palevioletred']);
      _self.absDistortionScale = d3.scaleLinear()
          .domain(d3.extent(permutationDiffsFlattened, (d) => d.absDistortion))
          .range(['white', 'indigo']);
      _self.absDistortionBtnPairsScale = d3.scaleLinear()
          .domain(d3.extent(permutationDiffsFlattened, (d) => d.absDistortion))
          .range(['white', gs.betweenGroupColor]);
      _self.absDistortionWtnPairsScale = d3.scaleLinear()
          .domain(d3.extent(permutationDiffsFlattened, (d) => d.absDistortion))
          .range(['white', gs.withinGroupColor]);
      _self.sumDistortionScale = d3.scaleLinear()
          .domain(d3.extent(instances, (d) => d.sumDistortion))
          .range([5, _self.layout.svgMatrix.distortionSumPlotRight.width - 10]);
      _self.xAttributeScale = d3.scaleLinear()
          .domain(d3.extent(dataX, (d) => d.features[Object.keys(d.features)[0]]))
          .range(['white', '#5598b7']);
      _self.yAttributeScale = d3.scaleLinear()
          .domain(d3.extent(dataY, (d) => d.features[Object.keys(d.features)[0]]))
          .range(['white', '#5598b7']);

      // For sum heatmap matrix
      _self.xHistoMatrixScale = d3.scaleBand()
          .domain(d3.range(nBinPerAxis))  // For now, it's just an index of items(from observed)
          .range([0, _self.layout.svgMatrix.histoMatrix.width]);
      _self.yHistoMatrixScale = d3.scaleBand()
          .domain(d3.range(nBinPerAxis))  // For now, it's just an index of items(from observed)
          .range([_self.layout.svgMatrix.distortionSumPlotUpper.height, 
                  _self.layout.svgMatrix.histoMatrix.height + _self.layout.svgMatrix.distortionSumPlotUpper.height]);
      _self.cellHistoWidth = _self.xHistoMatrixScale.bandwidth();
      _self.cellHistoHeight = _self.yHistoMatrixScale.bandwidth();
      _self.sumAbsDistortionScale = d3.scaleLinear()
          .domain(d3.extent(_self.dataBinFlattened, (d) => d.sumAbsDistortion))
          .range(['white', 'indigo']);

      //*** Initial sort
      // Sort x or y data (Sort by the feature & add sorting index)
      const sortMatrixXBy = 'ranking',
            sortMatrixYBy = 'ranking';

      let sortedSelectedX = [...dataSelectedX].sort((a, b) => d3.ascending(a.ranking, b.ranking)),
          sortedSelectedY = [...dataSelectedY].sort((a, b) => d3.ascending(a.ranking, b.ranking));

      _self.xMatrixScale
          .domain(_.map(sortedSelectedX, (d) => d.ranking));
      _self.yMatrixScale
          .domain(_.map(sortedSelectedY, (d) => d.ranking));
      _self.xAttributeScale
          .domain(d3.extent(sortedSelectedX, (d) => 
            sortMatrixXBy === 'sumDistortion' ? d.sumDistortion 
            : sortMatrixXBy === 'ranking' ? d.ranking
            : d.features[ sortMatrixXBy ]
          ));
      _self.yAttributeScale
          .domain(d3.extent(sortedSelectedY, (d) => 
            sortMatrixYBy === 'sumDistortion' ? d.sumDistortion 
            : sortMatrixYBy === 'ranking' ? d.ranking
            : d.features[ sortMatrixYBy ]
          ));

      const gMatrix = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_matrix')
                .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',0)'),
            gCells = gMatrix.selectAll('.g_cell')
                .data(selectedPermutationDiffsFlattend)
                .enter().append('g')
                .attr('class', 'g_cell')
                .attr('transform', function(d){
                  return 'translate(' + _self.xMatrixScale(d.ranking1) + ',' + _self.yMatrixScale(d.ranking2) + ')';
                }),
            gAttrPlotLeft = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_attr_plot_x')
                .attr('transform', 'translate(0,0)'),
            gAttrPlotBottom = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_attr_plot_y')
                .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',' + 
                                                  (_self.layout.svgMatrix.matrixPlot.height + _self.layout.svgMatrix.distortionSumPlotUpper.height) + ')'),
            gHistoMatrix = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_histo_matrix')
                .attr('transform', 'translate(' + (_self.layout.svgMatrix.attrPlotLeft.width + _self.layout.svgMatrix.matrixPlot.width + 20) + ',0)'),
            gHistoCells = gHistoMatrix.selectAll('.g_histo_cell')
                .data(_self.dataBinFlattened)
                .enter().append('g')
                .attr('class', 'g_histo_cell')
                .attr('transform', function(d){
                  return 'translate(' + _self.xHistoMatrixScale(d.idx1) + ',' + _self.yHistoMatrixScale(d.idx2) + ')';
                });
                                
      // Top-k line
      if (sortMatrixXBy === 'ranking') {
        const topkLineX = gMatrix.append('line')
                .attr('x1', _self.xMatrixScale(topk))
                .attr('y1', _self.yMatrixScale(1))
                .attr('x2', _self.xMatrixScale(topk))
                .attr('y2', _self.yMatrixScale(to))
                .style('stroke', 'red')
                .style('stroke-width', 1);
      }
      if (sortMatrixYBy === 'ranking') {
        const topkLineY = gMatrix.append('line')
                .attr('x1', _self.xMatrixScale(1))
                .attr('y1', _self.yMatrixScale(topk))
                .attr('x2', _self.xMatrixScale(to))
                .attr('y2', _self.yMatrixScale(topk))
                .style('stroke', 'red')
                .style('stroke-width', 1);
      }

      // Axis X1, X2 name
      const axisX1 = gMatrix.append('text')
              .attr('x', this.layout.svgMatrix.matrixPlot.width + 10)
              .attr('y', this.layout.svgMatrix.matrixPlot.height + 15)
              .text('X1')
              .style('font-size', '11px')
              .style('fill', '#d9d9d9'),
            axisX2 = gMatrix.append('text')
              .attr('x', 0)
              .attr('y', 0)
              .text('X2')
              .style('font-size', '11px')
              .style('fill', '#d9d9d9');

      // For Matrix plot
      gCells.append('rect')
          .attr('class', 'pair_rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', _self.cellWidth)
          .attr('height', _self.cellHeight)
          .style('fill', (d) => {
            const distortion = d.distortion,
                  distortionMin = _self.distortionScale.domain()[0],
                  distortionMax = _self.distortionScale.domain()[1],
                  distortionInterval = distortionMax - distortionMin,
                  fairThreshold = _self.distortionScale.domain()[0] + distortionInterval * 0.05,
                  outlierThreshold = _self.distortionScale.domain()[1] - 0.000000000000000000000000000000000000000000000005;
          
            let fillColor = _self.distortionScale(d.distortion);
            
            if(distortion < fairThreshold) {
              fillColor = 'blue';
            } else if (distortion > outlierThreshold) {
              fillColor = 'red';
            }
            
            return _self.absDistortionScale(d.absDistortion);
          })
          .style('stroke', (d) => {
            const distortion = d.distortion,
                  distortionMin = _self.distortionScale.domain()[0],
                  distortionMax = _self.distortionScale.domain()[1],
                  distortionInterval = distortionMax - distortionMin,
                  fairThreshold = _self.distortionScale.domain()[0] + distortionInterval * 0.05,
                  outlierThreshold = _self.distortionScale.domain()[1] - distortionInterval * 0.05;
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

      // Attribute plot left
      gAttrPlotLeft.selectAll('.attr_rect_left')
          .data(sortedSelectedY)
          .enter().append('rect')
          .attr('class', 'attr_rect_left')
          .attr('x', 25)
          .attr('y', (d) => _self.yMatrixScale(d.ranking))
          .attr('width', 10)
          .attr('height', _self.yMatrixScale.bandwidth() - 1)
          .attr('fill', (d) => 
            (sortMatrixYBy === 'sumDistortion') ? _self.yAttributeScale(d.sumDistortion) 
            : (sortMatrixYBy === 'ranking') ? _self.yAttributeScale(d.ranking) 
            : _self.yAttributeScale(d.features[sortMatrixYBy])
          )
          .attr('stroke', 'black')
          .attr('stroke-width', 0.4);

      // Attribute plot bottom
      gAttrPlotBottom.selectAll('.attr_rect_bottom')
          .data(sortedSelectedX)
          .enter().append('rect')
          .attr('class', 'attr_rect_bottom')
          .attr('x', (d) => _self.xMatrixScale(d.ranking))
          .attr('y', (d) => 5)
          .attr('width', _self.xMatrixScale.bandwidth() - 1)
          .attr('height', 10)
          .attr('fill', (d) => 
            (sortMatrixXBy === 'sumDistortion') ? _self.xAttributeScale(d.sumDistortion) 
            : (sortMatrixXBy === 'ranking') ? _self.xAttributeScale(d.ranking) 
            : _self.xAttributeScale(d.features[sortMatrixXBy])
          )
          .attr('stroke', 'black')
          .attr('stroke-width', 0.4);

      // For histo matrix
      gHistoCells.append('rect')
          .attr('class', 'histo_rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', _self.cellHistoWidth)
          .attr('height', _self.cellHistoHeight)
          .style('fill', (d) => _self.sumAbsDistortionScale(d.sumAbsDistortion))
          .style('stroke', (d) => 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

      gHistoMatrix.append('rect')
          .attr('class', 'histo_selected_area')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', _self.xHistoMatrixScale(2) - _self.xHistoMatrixScale(0))
          .attr('height', _self.yHistoMatrixScale(0) - _self.yHistoMatrixScale(2))
          .style('fill', (d) => '#8BC34A')
          .style('fill-opacity', 0.5)
          .style('stroke', (d) => 'black')
          .style('stroke-dasharray', '2,2')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);
    }

    renderPlot() {
      let _self = this;

      _self.svg = new ReactFauxDOM.Element('svg');
  
      _self.svg.setAttribute('width', _self.layout.svg.width);
      _self.svg.setAttribute('height', _self.layout.svg.height);
      _self.svg.setAttribute('0 0 200 200');
      _self.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svg.setAttribute('transform', 'translate(0,10)');
      _self.svg.style.setProperty('margin', '0 10px');

      let { data, pairwiseDiffs, confIntervalPoints, selectedRankingInterval } = _self.props,
          selectedInstanceIdx = _self.props.selectedRankingInterval;

      // data
      pairwiseDiffs = _.orderBy(pairwiseDiffs, ['scaledDiffInput']);
      const dataWithinGroupPair1 = _.filter(pairwiseDiffs, (d) => d.pair === 1),
            dataWithinGroupPair2 = _.filter(pairwiseDiffs, (d) => d.pair === 2),
            dataWithinGroupPair = _.filter(pairwiseDiffs, (d) => d.pair !== 3),
            dataBetweenGroupPair = _.filter(pairwiseDiffs, (d) => d.pair === 3),
            sumWithinGroupPair1 = dataWithinGroupPair1
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            sumWithinGroupPair2 = dataWithinGroupPair2
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            sumWithinGroupPair = dataWithinGroupPair
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            sumBetweenGroupPair = dataBetweenGroupPair
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            absSumWithinGroupPair1 = dataWithinGroupPair1
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            absSumWithinGroupPair2 = dataWithinGroupPair2
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            absSumWithinGroupPair = dataWithinGroupPair
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            absSumBetweenGroupPair = dataBetweenGroupPair
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            avgWithinGroupPair1 = sumWithinGroupPair1 / dataWithinGroupPair1.length,
            avgWithinGroupPair2 = sumWithinGroupPair2 / dataWithinGroupPair2.length,
            avgWithinGroupPair = absSumWithinGroupPair / dataWithinGroupPair.length,
            avgBetweenGroupPair = absSumBetweenGroupPair / dataBetweenGroupPair.length,
            absAvgWithinGroupPair1 = absSumWithinGroupPair1 / dataWithinGroupPair1.length,
            absAvgWithinGroupPair2 = absSumWithinGroupPair2 / dataWithinGroupPair2.length,
            absAvgWithinGroupPair = absSumWithinGroupPair / dataWithinGroupPair.length,
            absAvgBetweenGroupPair = absSumBetweenGroupPair / dataBetweenGroupPair.length,
            groupSkewAvgs = [
              absAvgWithinGroupPair1, 
              absAvgWithinGroupPair2, 
              absAvgWithinGroupPair,
              absAvgBetweenGroupPair
            ];

      // Coordinate scales
      _self.xObservedScale = d3.scaleLinear()
            .domain(d3.extent(pairwiseDiffs, (d) => Math.abs(d.scaledDiffInput)))
            .range([0, _self.layout.plot.width]),
      _self.yDistortionScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([_self.layout.plot.height - _self.layout.plot.padding, _self.layout.plot.padding]),
      _self.xGroupSkewScale = d3.scaleBand()
            .domain([0, 1, 2, 3, 4, 5])
            .range([0, _self.layout.groupSkew.width]),
      _self.yGroupSkewScale = d3.scaleLinear()  // Max value among sum of pairs
            .domain([ 0, Math.max(avgWithinGroupPair1, avgWithinGroupPair2, avgWithinGroupPair, avgBetweenGroupPair) ])
            .range([_self.layout.plot.height - 10, 0]);

      const gPlot = d3.select(_self.svg).append('g')
              .attr('class', 'g_plot')
              .attr('transform', 'translate(0, 0)'),
            gViolinPlot = gPlot.append('g')
              .attr('class', 'g_violin_plot')
              .attr('transform', 'translate(' + (this.layout.plot.width + 30) + ',' + '0)'),
            gGroupSkew = gPlot.append('g')
              .attr('transform', 'translate(' + (this.layout.plot.width + 110 + 30) + ',' + '0)');

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
              .attr('x2', 100)
              .attr('y2', _self.yDistortionScale(0))
              .style('stroke-dasharray', '3,3')
              .style('stroke', 'lightgray')
              .style('stroke-width', 3),
            yAxisGroupSkewLine = yAxisGroupSkew.select('path')
              .style('stroke-width', 3);

      _self.pairColorScale = d3.scaleThreshold()
            .domain([1, 2, 3, 4])  // pair is one or two or three
            .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor, gs.withinGroupColor]);   

      const margin = 20,
            outlierMargin = 5,
            outlierInterval = 0.05,
            lowerLimit = -0.90,
            upperLimit = 0.90;
            
      let confIntervalLine = d3.line()
          .x((d) => {_self.xObservedScale(d.x)})
          .y((d) => _self.yDistortionScale(d.y));

      const confInterval = gPlot.append('path')
          .datum(confIntervalPoints)
          .attr('class', 'conf_interval_line')
          .attr('d', confIntervalLine)
          .style('stroke', d3.rgb('lightblue').darker())
          .style('stroke-width', 1)
          .style('stroke-dasharray', '2, 2')
          .style('fill', 'lightblue')
          .style('opacity', 0.5);

      const upperOutlierArea = gPlot
                .append('rect')
                .attr('class', 'upper_outlier_rect')
                .attr('x', 0)
                .attr('y', _self.yDistortionScale(1))
                .attr('width', _self.layout.plot.width)
                .attr('height', _self.yDistortionScale(upperLimit) - _self.yDistortionScale(1))
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2'),
            lowerOutlierArea = gPlot
                .append('rect')
                .attr('class', 'lower_outlier_rect')
                .attr('x', 0)
                .attr('y', _self.yDistortionScale(lowerLimit))
                .attr('width', _self.layout.plot.width)
                .attr('height', _self.yDistortionScale(-1) - _self.yDistortionScale(lowerLimit))
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2');
  
      const coordsCircles = gPlot
              .selectAll('.coords_circle')
              .data(_.sampleSize(pairwiseDiffs, 100)) // Random sampling by Fisher-Yate shuffle
              .enter().append('circle')
              .attr('class', (d) => {
                const pairCircleClass = 'coords_circle',
                      groupClass = (d.pair === 1) ? 'groupPair1'
                          : (d.pair === 2) ? 'groupPair2'
                          : 'betweenGroupPair',
                      fairClass = (d.isFair === 1) ? 'fairPair'
                          : '',
                      outlierClass = (d.isOutlier === 1) ? 'outlierPair'
                          : '';

                return pairCircleClass + ' ' + groupClass + ' ' + fairClass + ' ' + outlierClass;
              })
              .attr('cx', (d) => _self.xObservedScale(Math.abs(d.scaledDiffInput)))
              .attr('cy', (d) => _self.yDistortionScale(d.distortion))
              .attr('r', 3)
              .style('fill', (d) => _self.pairColorScale(d.pair))
              .style('stroke', (d) => {
                return (d.isFair === 1) ? 'blue'
                  : d.isOutlier ? 'red'
                  : 'black'
              })
              .style('stroke-width', (d) => d.isFair || d.isOutlier ? 2 : 1)
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

                    // Console out the pair information


                    // // left semicircle
                    // d3.select('.g_plot')
                    //   .append('path')
                    //   .attr('class', 'mouseoverPairColor mouseoverPairCircleRight')
                    //   .attr('d', circleArc)
                    //   .attr('transform', function(e) {
                    //     return 'translate(' + (_self.xObservedScale(Math.abs(d.scaledDiffInput)) - 1) + ',' + _self.yDistortionScale(d.distortion) + ')' + 'rotate(180)'
                    //   })
                    //   .style('stroke', (e) => d3.rgb(_self.pairColorScale(d.pair)).darker())
                    //   .style('fill', (e) => _self.pairColorScale(d.pair));

                    // // right semicircle
                    // d3.select('.g_plot')
                    //   .append('path')
                    //   .attr('class', 'mouseoverPairColor mouseoverPairCircleRight')
                    //   .attr('d', circleArc)
                    //   .attr('transform', function(e) {
                    //     return 'translate(' + (_self.xObservedScale(Math.abs(d.scaledDiffInput)) + 1) + ',' + _self.yDistortionScale(d.distortion) + ')' + 'rotate(0)'
                    //   })
                    //   .style('stroke', (e) => {
                    //     return d3.rgb(_self.pairColorScale(d.pair)).darker()
                    //   })
                    //   .style('fill', (e) => _self.pairColorScale(d.pair));
              })
              .on('mouseout', (d) => {
                    d3.selectAll('.coords_circle')
                      .style('opacity', 0.8);

                    d3.selectAll('.coords_rect')
                      .style('opacity', 1);

                    d3.selectAll('.mouseoverPairColor').remove();
              });

      // Handle mouseover action
      coordsCircles
          .filter((d) => (d.idx1 !== selectedInstanceIdx) && (d.idx2 !== selectedInstanceIdx))
          .style('opacity', 0.1);
              
      // Fit non-linear curved line
      const fit = regression.polynomial(_.map(pairwiseDiffs, (d) => 
              [ Math.abs(d.scaledDiffInput), d.distortion ]
            ), {order: 9}),
            fitBetweenGroup = regression.polynomial(
              _.chain(pairwiseDiffs)
                .filter((d) => d.pair === 3)
                .map((d) => 
                  [ Math.abs(d.scaledDiffInput), d.distortion ]
                )
                .value(), 
              {order: 9}
            ),
            fitWithinGroup = regression.polynomial(
              _.chain(pairwiseDiffs)
                .filter((d) => d.pair === 1)
                .map((d) => 
                  [ Math.abs(d.scaledDiffInput), d.distortion ]
                )
                .value(), 
              {order: 9}
            );

      const fittedLine = d3.line()
              .x((d) => _self.xObservedScale(d[0]))
              .y((d) => _self.yDistortionScale(d[1])),
            fittedPath1 = gPlot.append('path')
              .datum(fit.points)
              .attr('d', fittedLine)
              .style('stroke', 'black')
              .style('fill', 'none')
              .style('stroke-width', '3px')
              .style('stroke-dasharray', '10,10'),
            fittedPath2 = gPlot.append('path')
              .datum(fitBetweenGroup.points)
              .attr('d', fittedLine)
              .style('stroke', '#8dee8c')
              .style('fill', 'none')
              .style('stroke-width', '3px')
              .style('stroke-dasharray', '10,10'),
            fittedPath3 = gPlot.append('path')
              .datum(fitWithinGroup.points)
              .attr('d', fittedLine)
              .style('stroke', 'purple')
              .style('fill', 'none')
              .style('stroke-width', '3px')
              .style('stroke-dasharray', '10,10');
      
      // Violin plot for summary
      const histoChart = d3.histogram()
              .domain(_self.yDistortionScale.domain())
              .thresholds([-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1])
              .value(d => d),
            histoChartWhole = histoChart(_.map(pairwiseDiffs, (d) => d.distortion)),
            histoChartWithinGroupPair1 = histoChart(_.map(dataWithinGroupPair1, (d) => d.distortion)),
            histoChartWithinGroupPair2 = histoChart(_.map(dataWithinGroupPair2, (d) => d.distortion)),
            histoChartBetweenGroupPair = histoChart(_.map(dataBetweenGroupPair, (d) => d.distortion)),
            xViolinPlotWithinGroupPair1Scale = d3.scaleLinear()
              .domain(d3.extent(histoChartWithinGroupPair1, (d) => d.length))
              .range([0, 15]),
            xViolinPlotWithinGroupPair2Scale = d3.scaleLinear()
              .domain(d3.extent(histoChartWithinGroupPair2, (d) => d.length))
              .range([0, 15]),
            xViolinPlotBetweenGroupPairScale = d3.scaleLinear()
              .domain(d3.extent(histoChartBetweenGroupPair, (d) => d.length))
              .range([0, 15]),
            areaWithinGroupPair1 = d3.area()
              .x0(d => -xViolinPlotWithinGroupPair1Scale(d.length))
              .x1(d => xViolinPlotWithinGroupPair1Scale(d.length))
              .y(d => _self.yDistortionScale(d.x0))
              .curve(d3.curveCatmullRom),
            areaWithinGroupPair2 = d3.area()
              .x0(d => -xViolinPlotWithinGroupPair2Scale(d.length))
              .x1(d => xViolinPlotWithinGroupPair2Scale(d.length))
              .y(d => _self.yDistortionScale(d.x0))
              .curve(d3.curveCatmullRom),
            areaBetweenGroupPair = d3.area()
              .x0(d => -xViolinPlotBetweenGroupPairScale(d.length))
              .x1(d => xViolinPlotBetweenGroupPairScale(d.length))
              .y(d => _self.yDistortionScale(d.x0))
              .curve(d3.curveCatmullRom);

      gViolinPlot.selectAll('.g_violin')
          .data([ histoChartWithinGroupPair1, histoChartWithinGroupPair2, histoChartBetweenGroupPair ])
          .enter().append('g')
          .attr('class', 'g_violin')
          .attr('transform', (d, i) => `translate(${i * 40}, 0)`)
          .append('path')
          .style('stroke','black')
          .style('stroke-width', 2)
          .style('fill', (d, i) => _self.pairColorScale(i + 1)) // i == 0 => pair == 1 => pair1
          .style('fill-opacity', 0.8)
          .attr('d', (d, i) => {
            if (i+1 === 1)
              return areaWithinGroupPair1(d);
            else if (i+1 === 2)
              return areaWithinGroupPair2(d);
            else if (i+1 === 3)
              return areaBetweenGroupPair(d);
          });

      // Group Skew plot
      // i => 1: groupPairs1, 2: groupPairs2, 3: withinPairs, 4: betweenPairs
      let groupSkewRect1, groupSkewCircle1,
          idx = 1,
          groupSkewScore = Math.round((absAvgBetweenGroupPair / absAvgWithinGroupPair) * 100) / 100; // avgBetweenPairs / avgWithinPairs
    
      gGroupSkew
          .selectAll('.groupSkewRect')
          .data(groupSkewAvgs)
          .enter().append('rect')
          .attr('class', 'groupSkewRect')
          .attr('x', (d, i) => _self.xGroupSkewScale(i + 1))
          .attr('y', (d) => 
            d > 0
              ? _self.yGroupSkewScale(d) + 1
              : _self.yGroupSkewScale(0)
          )
          .attr('width', 1)
          .attr('height', (d) => 
              Math.abs(_self.yGroupSkewScale(d) - _self.yGroupSkewScale(0))
          )
          .style('fill', 'none')
          .style('stroke', (d, i) => _self.pairColorScale(i + 1))
          .style('stroke-width', 1)
          .style('stroke-dasharray', '5,5');

      gGroupSkew
          .selectAll('.groupSkewCircle')
          .data(groupSkewAvgs)
          .enter().append('circle')
          .attr('class', 'groupSkewCircle')
          .attr('cx', (d, i) => _self.xGroupSkewScale(i + 1) + 1.5)
          .attr('cy', (d, i) => _self.yGroupSkewScale(d))
          .attr('r', 4)
          .style('fill', (d, i) => _self.pairColorScale(i + 1))
          .style('stroke', (d, i) => d3.rgb(_self.pairColorScale(i + 1)).darker())
          .style('stroke-opacity', 0.8);

      const groupSkewLine = gGroupSkew
            .append('line')
            .attr('x1', 0)
            .attr('y1', _self.yGroupSkewScale(0))
            .attr('x2', 60)
            .attr('y2', _self.yGroupSkewScale(0))
            .style('stroke', 'black')
            .style('stroke-width', 3);
    }

    handleSelectGroupCheckbox(checked) {
    }

    handleSelectOutlierAndFairCheckbox(checked) {
    }

    renderFeatureCorrForTable() {
      const _self = this;
      const { featureCorrSelections } = this.state;
  
      return featureCorrSelections.map((d) => {
        return {
          feature_set: d.feature_set,
          correlation: d.corr
        };
      });
    }
  
    render() {
      if ((!this.props.data || this.props.data.length === 0) || 
          (!this.props.pairwiseDiffs || this.props.pairwiseDiffs.length === 0) ||
          (!this.props.permutationDiffs || this.props.permutationDiffs.length === 0) ||
          (!this.props.permutationDiffsFlattened || this.props.permutationDiffsFlattened.length === 0)
         ) {
        return <div />
      }
      const _self = this;
         
      _self.renderPlot();
      _self.renderMatrix();

      const columns = [
        { title: 'Feature set', dataIndex: 'feature_set', key: 1, width: 100 },
        { title: 'Correlation', dataIndex: 'correlation', key: 2 }
      ];

      const CheckboxGroup = Checkbox.Group,
            groupOptions = [
            { label: 'Men', value: 'Men' },
            { label: 'Women', value: 'Women' },
            { label: 'Between', value: 'Between' }
          ],
            outlierAndFairOptions = [
              { label: 'Outliers', value: 'Outliers' },
              { label: 'Fair pairs', value: 'Fair pairs' }
          ],
            colorOptions = [
              { label: 'Signed', value: 'Signed' },
              { label: 'Absolute', value: 'Absolute' }
          ];
      
      return (
        <div className={styles.DistortionView}>
          <div className={styles.distortionViewTitleWrapper}>
            <div className={index.subTitle + ' ' + styles.distortionViewTitle}>Distortions</div>
          </div>
          <LegendView 
            className={styles.LegendView} 
          />
          <div className={styles.CorrelationView}>
            <div className={styles.matrixColorDropdownWrapper}>
              <div className={styles.subTitle}>Color cells</div>
              <Dropdown className={styles.colorMatrixDropdown}
                        isOpen={this.state.colorMatrixDropdownOpen}  
                        size='sm' 
                        toggle={this.toggleMatrixColor}>
                <DropdownToggle caret>
                  {this.state.colorMatrixDropdownValue}
                </DropdownToggle>
                <DropdownMenu>
                  {this.renderMatrixXDropdownSelections()}
                </DropdownMenu>
              </Dropdown>
            </div>
            <div className={styles.matrixDropdownWrapper}>
              <div className={styles.subTitle}>Sort X1, X2</div>
              <div className={styles.sortMatrixXdropdownWrapper}>
                <Dropdown className={styles.sortMatrixXdropdown}
                          isOpen={this.state.sortMatrixXdropdownOpen}  
                          size='sm' 
                          toggle={this.toggleMatrixX}>
                  <DropdownToggle caret>
                    {this.state.sortMatrixXdropdownValue}
                  </DropdownToggle>
                  <DropdownMenu>
                    {this.renderMatrixXDropdownSelections()}
                  </DropdownMenu>
                </Dropdown>
              </div>
              <div className={styles.sortMatrixYdropdownWrapper}>
                <Dropdown className={styles.sortMatrixYdropdown}
                          isOpen={this.state.sortMatrixYdropdownOpen}  
                          size='sm' 
                          toggle={this.toggleMatrixY}>
                  <DropdownToggle caret>
                    {this.state.sortMatrixYdropdownValue}
                  </DropdownToggle>
                  <DropdownMenu>
                    {this.renderMatrixYDropdownSelections()}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            <div className={styles.correlationTableWrapper}>
              <div className={styles.subTitle}>Correlation</div>
              <Table
                columns={columns} 
                dataSource={this.renderFeatureCorrForTable()} 
                scroll={{ y: 200 }}
                pagination={false}
              />
            </div>
          </div>
          <div className={styles.MatrixWrapper}>
            <div className={styles.MatrixView}>
              {this.svgMatrix.toReact()}
            </div>
          </div>
          <div className={styles.DistortionAnalysisView}>
            <div className={styles.subTitle}>Distortion analysis</div>
            <div className={styles.DistortionPlot}>
              {this.svg.toReact()}
            </div>
          </div>
        </div>
      );
    }
  }

  export default IndividualFairnessView;