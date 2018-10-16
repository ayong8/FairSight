import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Checkbox, Icon, Table } from 'antd';

import LegendView from 'components/RankingInspectorView/LegendView';
import IndividualInspectionView from 'components/IndividualInspectionView';
import TopkRankingView from 'components/TopkRankingView';
import InputSpaceView from 'components/InputSpaceView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class RankingInspectorView extends Component {
    constructor(props) {
      super(props);

      // To calculate pairwise and permutation diffs
      this.inputScale;
      this.outputScale;

      this.combinedCoordsData = [],
      
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
      // this.handleMouseoverInstance = this.handleMouseoverInstance.bind(this);
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
      console.log('RankingInspectorView rendered');
      if ((!this.props.data || this.props.data.length === 0) || 
          (!this.props.permutationDiffs || this.props.permutationDiffs.length === 0) ||
          (!this.props.permutationDiffsFlattened || this.props.permutationDiffsFlattened.length === 0)
         ) {
        return <div />
      }
      const _self = this;
         
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
        <div className={styles.RankingInspectorView}>
          <div className={styles.rankingInspectorViewTitleWrapper}>
            <div className={index.subTitle + ' ' + styles.rankingInspectorViewTitle}>Distortions</div>
          </div>
          <div className={styles.SpaceView}>
            <LegendView 
              className={styles.LegendView} 
            />
            <TopkRankingView 
                className={styles.TopkRankingView}
                data={this.props.data}
                topk={this.props.topk}
                selectedInstances={this.props.selectedInstances} />
            <InputSpaceView 
                className={styles.InputSpaceView}
                data={this.props.data}
                topk={this.props.topk}
                inputCoords={this.props.inputCoords}
                selectedInstance={this.props.selectedInstance}
                selectedInstances={this.state.selectedInstances} 
                // onMouseoverInstance={this.handleMouseoverInstance} 
            />
            <div className={styles.MatrixWrapper}>
              <div className={styles.MatrixView}>
                {this.svgMatrix.toReact()}
              </div>
            </div>
          </div>
          <IndividualInspectionView
              className={styles.IndividualInspectionView}
              data={this.props.data}
              topk={this.props.topk}
              selectedInstance={this.props.selectedInstance}
              selectedRankingInterval={this.props.selectedRankingInterval} />
          <div className={styles.DistortionAnalysisView}>
            <div className={styles.subTitle}>Distortion analysis</div>
            <div className={styles.DistortionPlot}>
              
            </div>
          </div>
        </div>
      );
    }
  }

  export default RankingInspectorView;