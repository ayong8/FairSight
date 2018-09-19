import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { beeswarm } from 'd3-beeswarm';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Checkbox, Icon } from 'antd';
import regression from 'regression';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

function pairwise(list) {
  if (list.length < 2) { return []; }
  var first = list[0],
      rest  = list.slice(1),
      pairs = rest.map(function (x) { return [first, x]; });
  return pairs.concat(pairwise(rest));
}

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

      // For legend view
      this.svgLegend;

      // For matrix view
      this.xSelectedFeature = 'credit_amount'
      this.ySelectedFeature = 'age'
      this.xSortBy = 'credit_amount'
      this.ySortBy = 'age'
      this.xMatrixScale;
      this.yMatrixScale;
      this.cellWidth;
      this.cellHeight;
      this.cellColorDistortionScale;
      this.cellColorAbsDistortionScale;
      this.sumDistortionScale;

      this.xHistoMatrixScale;
      this.yHistoMatrixScale;
      this.cellHistoWidth;
      this.cellHistoHeight;
      this.sumAbsDistortionScale;

      this.dataPairwiseDiffs = [];
      this.dataSelectedPairwiseDiffs = [];
      this.dataPermutationDiffs = [];
      this.dataSelectedPermutationDiffs = [];
      this.dataPermutationDiffsFlattened = [];

      this.dataBin = [];
      this.dataBinFlattened = [];

      this.state = {
        selectedIntervalForMatrix: {
          from: 1,
          to: 50
        },
        confIntervalPoints: [],
        dropdownOpen: false,
        sortMatrixXdropdownOpen: false,
        sortMatrixYdropdownOpen: false,
        sortBy: 'close to far',
        sortMatrixXBy: 'distortion',
        sortMatrixYBy: 'distortion',
        sortMatrixXdropdownValue: 'features',
        sortMatrixYdropdownValue: 'features'
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
          height: 250,
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
        svgLegend: {
          width: 130,
          height: 150
        },
        groupSkew: {
          width: 55,
          height: 250
        },
        plot: {
          width: 350,
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

      this.renderSelectedInstance = this.renderSelectedInstance.bind(this);
      this.handleToggleMatrixX = this.handleToggleMatrixX.bind(this);
      this.handleToggleMatrixY = this.handleToggleMatrixY.bind(this);
      this.sortDistortion = this.sortDistortion.bind(this);
      this.handleSortingMatrixX = this.handleSortingMatrixX.bind(this);
      this.handleSortingMatrixY = this.handleSortingMatrixY.bind(this);
      this.handleSelectGroupCheckbox = this.handleSelectGroupCheckbox.bind(this);
      this.handleSelectOutlierAndFairCheckbox = this.handleSelectOutlierAndFairCheckbox.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (this.props.data !== nextProps.data) { return true; }
      if (this.props.selectedInstance !== nextProps.selectedInstance) { return true; }
      if (this.props.selectedRankingInterval !== nextProps.selectedRankingInterval) { return true; }
      if (this.props.pairwiseInputDistances !== nextProps.pairwiseInputDistances) { return true; }
      if (this.props.permutationInputDistances !== nextProps.permutationInputDistances) { return true; }
      if (this.props.inputCoords !== nextProps.inputCoords) { return true; }

      if (this.state.confIntervalPoints !== nextState.confIntervalPoints) { return true; }
  
      return false;
    }

    componentDidMount() {
      const _self = this,
            data = this.props.data,
            wholeInstances = data.instances;

      _self.setState({
        sortMatrixXBy: 'sumDistortion',
        sortMatrixYBy: 'sumDistortion',
        sortMatrixXdropdownValue: 'sumDistortion',
        sortMatrixYdropdownValue: 'sumDistortion'
      });

      _self.calculatePairwiseDiffs();
      _self.calculatePermutationDiffs();
      _self.calculateRSquared(_self.dataPairwiseDiffs);
      _self.calculatePredictionIntervalandOutliers(_self.dataPairwiseDiffs);
      _self.dataPermutationDiffsFlattened = _.flatten(_self.dataPermutationDiffs);
      _self.calculateSumDistortion(wholeInstances, _self.dataPermutationDiffsFlattened);
      _self.calculateNDM(_self.dataPermutationDiffs);

      // Calculate confidence interval
      const inputs = _.map(_self.dataPairwiseDiffs, (d) => {
              return {
                idx1: d.idx1,
                idx2: d.idx2,
                X: d.scaledDiffInput,
                y: d.distortion,
                yHat: 0
              }
          });

      fetch('/dataset/calculateConfidenceInterval/', {
            method: 'post',
            body: JSON.stringify(inputs)
          })
          .then( (response) => {
            return response.json();
          })   
          .then( (response) => {
            const confIntervalPoints = JSON.parse(response);

            this.setState({
              confIntervalPoints: confIntervalPoints
            });
            _self.setFairInstancesFromConfidenceInterval(confIntervalPoints, _self.dataPairwiseDiffs);
          });
    }

    combineInputsAndOutputs() {
      const _self = this;

      const dataInputCoords = _self.props.inputCoords,
            selectedRankingInterval = _self.props.selectedRankingInterval,
            data = _self.props.data,
            instances = data.instances,
            idx = _.map(instances, (d) => d.idx);
  
      // Union 
      const combinedData = _.map(idx, (currentIdx) => {
          let inputObj = _.find(dataInputCoords, {'idx': currentIdx}),
              instance = _.find(instances, {'idx': currentIdx});
  
          return {
            idx: currentIdx,
            group: inputObj.group,
            inputCoords: inputObj,
            instance: instance
          }
        });
  
      return combinedData;
    }
    // Calculate distortions of combinatorial pairs (For pairwise distortion plot)
    calculatePairwiseDiffs() {
      const _self = this;

      const instances = _self.combineInputsAndOutputs(),
            dataPairwiseInputDistances = _self.props.pairwiseInputDistances,
            dataPairs = pairwise(instances);
  
      _self.setScalesFromDataPairs(dataPairwiseInputDistances, dataPairs);

      // Get difference between input space(from dataPairwiseInputDistances) and output space(from dataPairs.output.ranking)
      let dataPairwiseDiffs = [];
      for(let i=0; i<dataPairs.length-1; i++){
        let diffInput = dataPairwiseInputDistances[i].input_dist,
            diffOutput = Math.abs(dataPairs[i][0].instance.ranking - dataPairs[i][1].instance.ranking),
            pair = 0;
  
        if((dataPairs[i][0].group === 1) && (dataPairs[i][1].group === 1))
          pair = 1;
        else if((dataPairs[i][0].group === 2) && (dataPairs[i][1].group === 2))
          pair = 2;
        else if(dataPairs[i][0].group !== dataPairs[i][1].group)
          pair = 3;
  
        dataPairwiseDiffs.push({
          idx1: dataPairs[i][0].idx,
          idx2: dataPairs[i][1].idx,
          x1: dataPairs[i][0].instance,
          x2: dataPairs[i][1].instance,
          pair: pair,
          diffInput: diffInput,
          diffOutput: diffOutput,
          scaledDiffInput: _self.inputScale(diffInput),
          scaledDiffOutput: _self.outputScale(diffOutput),
          distortion: _self.outputScale(diffOutput) - _self.inputScale(diffInput),
          absDistortion: Math.abs(_self.outputScale(diffOutput) - _self.inputScale(diffInput)),
          isFair: false,
          isOutlier: false
        });
      }
  
      _self.dataPairwiseDiffs = dataPairwiseDiffs;
    }
  
    // Calculate distortions of permutational pairs (For matrix view)
    calculatePermutationDiffs() {
      const _self = this;

      const instances = _self.combineInputsAndOutputs(),
            dataPermutationInputDistances = _self.props.permutationInputDistances;
  
      let dataPermutationDiffs = [], 
          input_idx = 0;
  
      _.forEach(instances, (obj1) => {
          let row = [];
          _.forEach(instances, (obj2) => {
            const diffInput = dataPermutationInputDistances[input_idx].input_dist,
                  diffOutput = Math.abs(obj1.instance.ranking - obj2.instance.ranking);
            let pair = 0;
  
              if((obj1.group === 1) && (obj2.group === 1))
                pair = 1;
              else if((obj1.group === 2) && (obj2.group === 2))
                pair = 2;
              else if(obj1.group !== obj2.group)
                pair = 3;
            
            row.push({
              idx1: obj1.idx,
              idx2: obj2.idx,
              x1: obj1.instance,
              x2: obj2.instance,
              pair: pair,
              diffInput: diffInput,
              diffOutput: diffOutput,
              scaledDiffInput: this.inputScale(diffInput),
              scaledDiffOutput: this.outputScale(diffOutput),
              distortion: this.outputScale(diffOutput) - this.inputScale(diffInput),
              absDistortion: Math.abs(this.outputScale(diffOutput) - this.inputScale(diffInput)),
              isFair: false,
              isOutlier: false
            });
  
            input_idx++;
          });
          dataPermutationDiffs.push(row);
      });
  
      _self.dataPermutationDiffs = dataPermutationDiffs;
    }
  
    setScalesFromDataPairs(dataPairwiseInputDistances, dataPairs){
      const _self = this;

      _self.inputScale = d3.scaleLinear()
          .domain(d3.extent(dataPairwiseInputDistances, (d) => d.input_dist))
          .range([0, 1]);
      _self.outputScale = d3.scaleLinear()
          .domain(d3.extent(dataPairs, (d) => 
              Math.abs(d[0].instance.ranking - d[1].instance.ranking))
          )
          .range([0, 1]);
    }

    calculateSumDistortion(instances, dataPermutationDiffsForMatrix) {
      _.forEach(instances, (d, i) => {
        instances[i].sumDistortion = dataPermutationDiffsForMatrix
            .filter((e) => e.idx1 === instances[i].idx)
            .map((e) => e.absDistortion)
            .reduce((sum, e) => sum + e);
      });
    }

    setFairInstancesFromConfidenceInterval(confIntervalPoints, dataPairwiseDiffs) {
      const _self = this;

      const dataPairForConfInterval = _.filter(confIntervalPoints, (d) => d.isUpper === 1),
            numPairs = dataPairwiseDiffs.length;

            for(let i=0; i<numPairs; i++){
              dataPairwiseDiffs[i].isFair = dataPairForConfInterval[i].isFair;
            };

      _self.dataPairwiseDiffs = dataPairwiseDiffs;
    }

    calculatePredictionIntervalandOutliers(dataPairwiseDiffs) {
      const distortions = _.map(dataPairwiseDiffs, (d) => {
            const distortion = d.distortion,
                  upperLimit = 0.90,  
                  lowerLimit = -0.90; // nt

            if((distortion > upperLimit) || (distortion < lowerLimit)) {
              d.isOutlier = true;
            }
          });
    }

    calculateRSquared(dataPairwiseDiffs) {
      let SSR_arr = [], SST_arr = [],
          SSR, SST, rSquared,
          n = dataPairwiseDiffs.length,
          meanY = _.sum(_.map(dataPairwiseDiffs, (d) => d.distortion)) / n;
      
      _.each(dataPairwiseDiffs, (d) => {
        SSR_arr.push(Math.pow(meanY - 0, 2));
        SST_arr.push(Math.pow(meanY - d.distortion, 2));
      });

      SSR = _.sum(SSR_arr);
      SST = _.sum(SST_arr);
      
      rSquared = Math.round((SSR / SST) * 100) / 100;

      this.setState((prevState) => ({
        rankingInstance: {
          ...prevState.rankingInstance,
          stat: {
            ...prevState.rankingInstance,
            goodnessOfFairness: rSquared
          }
        }
      }));
    }

    calculateNDM(dataSelectedPermutationDiffs) {  // Noise Dissimilarity Measure for feature matrix
      // Generate a random permutation
      let originalMat = _.map(dataSelectedPermutationDiffs, (arr) => _.map(arr, (d) => d.distortion)),
          noiseMat = _.shuffle(originalMat),
          n = originalMat.length,
          NHX = 3, NHY = 3, r = 1,// Number of neighborhoods to look at
          dissScoreArr = [],
          dissScoreSum, NDM,
          w = n * n * Math.pow((2*r + 1), 2);

      for(let i=0; i<n; i++) {
        dissScoreArr[i] = [];

        for(let j=0; j<n; j++) {
          // Check index i and j
          let neighborArr = [],
              sumSquaredDiffs = [],
              validIdx = [],
              NHsInOriginalMat = [], NHsInNoiseMat = [], 
              NHInNoiseMatMostSimilar, minDiffs = [],
              diffs = [];
          // Collect valid index
          for(let l=-1; l<=1; l++) {  // l = for x index of neighbors of originalMat[i][j]
            // Put all neighbors to find the best nearest neighbor of i
            for(let m=-1; m<=1; m++) {  // m = for y index of neighbors of originalMat[i][j]
              if(typeof(originalMat[i+l]) !== 'undefined' && typeof(originalMat[i+l][j+m]) !== 'undefined') {
                // Put it as valid idx to explore the same neighborhood area(index) for noiseMat
                validIdx.push({ x: i+l, y: j+m });
              }
            }
          }
          // Go over all valid index for noiseMat, and get the best similar one to the current originalMat[i][j]
          validIdx.forEach((idx) => {
            NHsInNoiseMat.push(noiseMat[idx.x][idx.y]);
            NHsInOriginalMat.push(originalMat[idx.x][idx.y]);
          });

          NHsInOriginalMat.forEach((o) => {
            diffs = _.map(NHsInNoiseMat, (n) => Math.abs(o - n));
            minDiffs.push(Math.min(...diffs));
          });
          sumSquaredDiffs = minDiffs.reduce((acc, curr) => acc + curr)
          dissScoreArr[i].push(sumSquaredDiffs);
        }
      }
      dissScoreSum = dissScoreArr.map((arr) => 
              arr.reduce((acc, curr) => acc + curr)
            ).reduce((acc, curr) => acc + curr);
      NDM = dissScoreSum / w;
    }

    renderSelectedInstance() {
      let data = this.props.data,
          instances = data.instances,
          selectedRankingIntervalIdx = this.props.selectedInstance,
          selectedInstance = instances.filter((d) => d.idx === selectedRankingIntervalIdx)[0];

      let featureValueDivs = Object.keys(selectedInstance.features).map((key, idx) => {
                return <div key={idx}>&nbsp;&nbsp;{key + ': ' + selectedInstance.features[key]}</div>;
              });

      return (
        <div className={styles.selectedRankingIntervalInfo}>
          <div><b>Features</b></div>
          <div>{featureValueDivs}</div>
        </div>
      );
    }

    renderMatrixXDropdownSelections() {
      const data = this.props.data;

      let allFeatures = [...data.features],
          distortionSelection = 'sumDistortion';
      allFeatures.push(distortionSelection);

      return allFeatures.map((feature) => 
          (<DropdownItem 
              value={feature} 
              onClick={this.handleSortingMatrixX}>
              {feature}
          </DropdownItem>));
    }

    renderMatrixYDropdownSelections() {
      let data = this.props.data;

      let allFeatures = [...data.features],
          distortionSelection = 'sumDistortion';
      allFeatures.push(distortionSelection);

      return allFeatures.map((feature) => 
          (<DropdownItem 
              value={feature} 
              onClick={this.handleSortingMatrixY}>
              {feature}
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

      let data = _self.props.data,
          wholeInstances = data.instances,
          instances = wholeInstances.slice(_self.state.selectedIntervalForMatrix.from - 1, _self.state.selectedIntervalForMatrix.to),
          selectedRankingInterval = _self.props.selectedRankingInterval,
          selectedInstance = _self.props.selectedInstance,
          distortionMin = d3.extent(_self.dataPermutationDiffsFlattened, (d) => d.distortion)[0],
          distortionMax = d3.extent(_self.dataPermutationDiffsFlattened, (d) => d.distortion)[1];

      // Subsetting permutation distortions for selected interval
      let dataSelectedPermutationDiffs = _self.dataPermutationDiffs,
          dataPermutationDiffsFlattend = _.flatten(dataSelectedPermutationDiffs),
          dataSelectedPermutationDiffsFlattend = _.filter(dataPermutationDiffsFlattend, (d) => 
            (d.idx1 >= _self.state.selectedIntervalForMatrix.from) && (d.idx1 <= _self.state.selectedIntervalForMatrix.to) &&
            (d.idx2 >= _self.state.selectedIntervalForMatrix.from) && (d.idx2 <= _self.state.selectedIntervalForMatrix.to)
          );

      // For x and y axis
      let dataX = wholeInstances,
          dataY = wholeInstances,
          dataSelectedX = instances,
          dataSelectedY = instances;

      const nDataPerAxis = 50,
            nXData = 50,  // # of data points per axis
            nYData = 50,
            nBinPerAxis = 10,
            nXBin = 10,
            nYBin = 10,
            nDataPerBin = (nXData * nYData) / (nXBin * nYBin);

      for (let i=0; i<nXBin; i++) {
        _self.dataBin[i] = [];
        for (let j=0; j<nYBin; j++) {
          _self.dataBin[i][j] = {};
          _self.dataBin[i][j].sumAbsDistortion = 0;
          _self.dataBin[i][j].idx1 = i;
          _self.dataBin[i][j].idx2 = j;

          for (let k=i*nDataPerBin; k<(i+1)*nDataPerBin; k++) {
            for (let l=j*nDataPerBin; l<(j+1)*nDataPerBin; l++) {
              _self.dataBin[i][j].sumAbsDistortion += _self.dataPermutationDiffs[k][l].absDistortion;
            }
          }
        }
      }

      console.log('dataBin: ', _self.dataBin);

      //*** Sort feature plot */
      _self.dataPermutationDiffsFlattened = _.flatten(_self.dataPermutationDiffs);
      _self.dataBinFlattened = _.flatten(_self.dataBin);
      
      _self.xMatrixScale = d3.scaleBand()
          .domain(_.map(dataSelectedX, (d) => d.idx))  // For now, it's just an index of items(from observed)
          .range([0, _self.layout.svgMatrix.matrixPlot.width]);
      _self.yMatrixScale = d3.scaleBand()
          .domain(_.map(dataSelectedY, (d) => d.idx))  // For now, it's just an index of items(from observed)
          .range([_self.layout.svgMatrix.matrixPlot.height, 0]);
      _self.cellWidth = _self.xMatrixScale.bandwidth();
      _self.cellHeight = _self.yMatrixScale.bandwidth();
      _self.cellColorDistortionScale = d3.scaleLinear()
          .domain([distortionMin, (distortionMin + distortionMax)/2, distortionMax])
          .range(['slateblue', 'white', 'palevioletred']);
      _self.cellColorAbsDistortionScale = d3.scaleLinear()
          .domain(d3.extent(_self.dataPermutationDiffsFlattened, (d) => d.absDistortion))
          .range(['white', 'indigo']);
      _self.sumDistortionScale = d3.scaleLinear()
          .domain(d3.extent(wholeInstances, (d) => d.sumDistortion))
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
          .range([_self.layout.svgMatrix.histoMatrix.height, 0]);
      _self.cellHistoWidth = _self.xHistoMatrixScale.bandwidth();
      _self.cellHistoHeight = _self.yHistoMatrixScale.bandwidth();
      _self.sumAbsDistortionScale = d3.scaleLinear()
          .domain(d3.extent(_self.dataBinFlattened, (d) => d.sumAbsDistortion))
          .range(['white', 'indigo']);

      //*** Initial sort
      // Sort x or y data (Sort by the feature & add sorting index)
      const sortMatrixXBy = 'sumDistortion',
            sortMatrixYBy = 'sumDistortion';

      let sortedSelectedX = [...dataSelectedX].sort((a, b) => d3.ascending(a.sumDistortion, b.sumDistortion)),
          sortedSelectedY = [...dataSelectedY].sort((a, b) => d3.ascending(a.sumDistortion, b.sumDistortion));

      _self.xMatrixScale
          .domain(_.map(sortedSelectedX, (d) => d.idx)),
      _self.yMatrixScale
          .domain(_.map(sortedSelectedY, (d) => d.idx));
      _self.xAttributeScale
          .domain(d3.extent(sortedSelectedX, (d) => 
            sortMatrixXBy === 'sumDistortion' ?
              d.sumDistortion :
              d.features[ sortMatrixXBy ])
          );
      _self.yAttributeScale
          .domain(d3.extent(sortedSelectedY, (d) => 
            sortMatrixXBy === 'sumDistortion' ?
              d.sumDistortion :
              d.features[ sortMatrixYBy ])
          );

      const gMatrix = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_matrix')
                .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',0)'),
            gCells = gMatrix.selectAll('.g_cell')
                .data(dataSelectedPermutationDiffsFlattend)
                .enter().append('g')
                .attr('class', 'g_cell')
                .attr('transform', function(d){
                  return 'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')';
                }),
            gAttrPlotLeft = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_attr_plot_x')
                .attr('transform', 'translate(0,0)'),
            gAttrPlotBottom = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_attr_plot_y')
                .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',' + 
                                                  _self.layout.svgMatrix.matrixPlot.height + ')'),
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
                                
      // For Matrix plot
      gCells.append('rect')
          .attr('class', 'pair_rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', _self.cellWidth)
          .attr('height', _self.cellHeight)
          .style('fill', (d) => {
            const distortion = d.distortion,
                  distortionMin = _self.cellColorDistortionScale.domain()[0],
                  distortionMax = _self.cellColorDistortionScale.domain()[1],
                  distortionInterval = distortionMax - distortionMin,
                  fairThreshold = _self.cellColorDistortionScale.domain()[0] + distortionInterval * 0.05,
                  outlierThreshold = _self.cellColorDistortionScale.domain()[1] - 0.000000000000000000000000000000000000000000000005;
          
            let fillColor = _self.cellColorDistortionScale(d.distortion);
            
            if(distortion < fairThreshold) {
              fillColor = 'blue';
            } else if (distortion > outlierThreshold) {
              fillColor = 'red';
            }
            
            return _self.cellColorAbsDistortionScale(d.absDistortion);
          })
          .style('stroke', (d) => {
            const distortion = d.distortion,
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
      const attrRectsLeft = gAttrPlotLeft.selectAll('.attr_rect_left')
          .data(sortedSelectedY)
          .enter().append('rect')
          .attr('class', 'attr_rect_left')
          .attr('x', 0)
          .attr('y', (d) => _self.yMatrixScale(d.idx))
          .attr('width', 5)
          .attr('height', _self.cellHeight)
          .attr('fill', (d) => 
            (sortMatrixYBy === 'sumDistortion') ? 
              _self.yAttributeScale(d.sumDistortion) : 
              _self.yAttributeScale(d.features[sortMatrixYBy])
          )
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

      gAttrPlotLeft.selectAll('.pair_rect_left')
          .data(sortedSelectedY)
          .enter().append('rect')
          .attr('class', 'pair_rect_left')
          .attr('x', 30)
          .attr('y', (d) => _self.yMatrixScale(d.idx))
          .attr('width', 3)
          .attr('height', _self.cellHeight)
          .attr('fill', (d) => 
            d.group === 1? 
              gs.groupColor1 : 
              gs.groupColor2
          )
          .attr('stroke', 'black')
          .attr('shape-rendering', 'crispEdge')
          .attr('stroke-width', 0.5);

      gAttrPlotLeft.selectAll('.sum_distortion_rect_left')
          .data(sortedSelectedY)
          .enter().append('rect')
          .attr('class', 'sum_distortion_rect_left')
          .attr('x', (d) => 30 - _self.sumDistortionScale(d.sumDistortion))
          .attr('y', (d) => _self.yMatrixScale(d.idx) + _self.cellHeight / 2)
          .attr('width', (d) => _self.sumDistortionScale(d.sumDistortion))
          .attr('height', 0.5)
          .attr('fill', (d) => 
            d.group === 1? 
              gs.groupColor1 : 
              gs.groupColor2
          )
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2);

      gAttrPlotLeft.selectAll('.sum_distortion_circle_left')
          .data(sortedSelectedY)
          .enter().append('circle')
          .attr('class', 'sum_distortion_circle_left')
          .attr('cx', (d) => 30 - _self.sumDistortionScale(d.sumDistortion))
          .attr('cy', (d) => _self.yMatrixScale(d.idx) + _self.cellHeight / 2)
          .attr('r', 2)
          .attr('fill', (d) => 
            d.group === 1? 
              gs.groupColor1 : 
              gs.groupColor2
          )
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2);

      // Bottom
      // For Attribute plot on the bottom
      const attrRectsBottom = gAttrPlotBottom.selectAll('.attr_rect_bottom')
          .data(sortedSelectedX)
          .enter().append('rect')
          .attr('class', 'attr_rect_bottom')
          .attr('x', (d) => _self.xMatrixScale(d.idx))
          .attr('y', 30)
          .attr('width', 5)
          .attr('height', _self.cellHeight)
          .attr('fill', (d) => 
            (sortMatrixXBy === 'sumDistortion')? 
            _self.xAttributeScale(d.sumDistortion) : 
            _self.xAttributeScale(d.features[sortMatrixXBy])
          )
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

      gAttrPlotBottom.selectAll('.pair_rect_bottom')
          .data(sortedSelectedX)
          .enter().append('rect')
          .attr('class', 'pair_rect_bottom')
          .attr('x', (d) => _self.xMatrixScale(d.idx))
          .attr('y', 5)
          .attr('width', _self.cellWidth)
          .attr('height', 3)
          .attr('fill', (d) => 
            d.group === 1? 
              gs.groupColor1 : 
              gs.groupColor2
          )
          .attr('stroke', 'black')
          .attr('shape-rendering', 'crispEdge')
          .attr('stroke-width', 0.5);

      // For sum distortion plot on the bottom
      gAttrPlotBottom.selectAll('.sum_distortion_rect_bottom')
          .data(sortedSelectedX)
          .enter().append('rect')
          .attr('class', 'sum_distortion_rect_bottom')
          .attr('x', (d) => _self.xMatrixScale(d.idx) + _self.cellWidth / 2)
          .attr('y', (d) => 8)
          .attr('width', 0.5)
          .attr('height', (d) => _self.sumDistortionScale(d.sumDistortion))
          .attr('fill', (d) => 
            d.group === 1? 
              gs.groupColor1 : 
              gs.groupColor2
          )
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2);

      gAttrPlotBottom.selectAll('.sum_distortion_circle_bottom')
          .data(sortedSelectedX)
          .enter().append('circle')
          .attr('class', 'sum_distortion_circle_bottom')
          .attr('cx', (d) => _self.xMatrixScale(d.idx) + _self.cellWidth / 2)
          .attr('cy', (d) => 8 + _self.sumDistortionScale(d.sumDistortion))
          .attr('r', 2)
          .attr('fill', (d) => 
            d.group === 1? 
              gs.groupColor1 : 
              gs.groupColor2
          )
          .attr('stroke', 'black')
          .attr('stroke-width', 0.2);

      // Handle mouseover action
      attrRectsLeft
          .filter((d) => d.idx === selectedInstance)
          .style('stroke-width', 2);

      attrRectsBottom
          .filter((d) => d.idx === selectedInstance)
          .style('stroke-width', 2);

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

    renderPlot() {
      let _self = this;

      _self.svg = new ReactFauxDOM.Element('svg');
  
      _self.svg.setAttribute('width', _self.layout.svg.width);
      _self.svg.setAttribute('height', _self.layout.svg.height);
      _self.svg.setAttribute('0 0 200 200');
      _self.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svg.setAttribute('transform', 'translate(0,10)');
      _self.svg.style.setProperty('margin', '0 10px');

      let selectedRankingInterval = _self.props.selectedRankingInterval,
          data = _self.props.data,
          dataPairwiseDiffs = _self.dataPairwiseDiffs,
          confIntervalPoints = _self.state.confIntervalPoints,
          selectedInstanceIdx = _self.props.selectedRankingInterval;

      // data
      dataPairwiseDiffs = _.orderBy(dataPairwiseDiffs, ['scaledDiffInput']);
      const dataWithinGroupPair1 = _.filter(dataPairwiseDiffs, (d) => d.pair === 1),
            dataWithinGroupPair2 = _.filter(dataPairwiseDiffs, (d) => d.pair === 2),
            dataWithinGroupPair = _.filter(dataPairwiseDiffs, (d) => d.pair !== 3),
            dataBetweenGroupPair = _.filter(dataPairwiseDiffs, (d) => d.pair === 3),
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
            .domain(d3.extent(dataPairwiseDiffs, (d) => Math.abs(d.scaledDiffInput)))
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
              .attr('transform', 'translate(120, 0)'),
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
              .data(_.sampleSize(dataPairwiseDiffs, 100)) // Random sampling by Fisher-Yate shuffle
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
      const fit = regression.polynomial(_.map(dataPairwiseDiffs, (d) => 
              [ Math.abs(d.scaledDiffInput), d.distortion ]
            ), {order: 9}),
            fitBetweenGroup = regression.polynomial(
              _.chain(dataPairwiseDiffs)
                .filter((d) => d.pair === 3)
                .map((d) => 
                  [ Math.abs(d.scaledDiffInput), d.distortion ]
                )
                .value(), 
              {order: 9}
            ),
            fitWithinGroup = regression.polynomial(
              _.chain(dataPairwiseDiffs)
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
            histoChartWhole = histoChart(_.map(dataPairwiseDiffs, (d) => d.distortion)),
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

      const gLegend = d3.select(_self.svg).append('g')
          .attr('class', 'g_legend')
          .attr('transform', 'translate(0, 0)');

      // legend border
      gLegend.append('rect')
          .attr('class', 'legend')
          .attr('x', 3)
          .attr('y', 3)
          .attr('width', 110)
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
          });

      gLegend.append('text')
          .attr('x', 30)
          .attr('y', 63)
          .text('Woman-Woman')
          .style('font-size', '11px');
    }

    handleToggleMatrixX() {
      this.setState(prevState => ({
        sortMatrixXdropdownOpen: !prevState.sortMatrixXdropdownOpen
      }));
    }

    handleToggleMatrixY() {
      this.setState(prevState => ({
        sortMatrixYdropdownOpen: !prevState.sortMatrixYdropdownOpen
      }));
    }

    sortDistortion() {
      this.setState(prevState => ({
        dropdownOpen: !prevState.dropdownOpen
      }));
    }

    handleSortingMatrixX(e) {
      let _self = this;

      let sortMatrixXBy = e.target.value,
          data = this.props.data,
          instances = data.instances,
          dataSelectedPermutationDiffs = this.dataSelectedPermutationDiffs;

      const sortedX = [...instances].sort((a, b) => 
                (sortMatrixXBy === 'sumDistortion') ?
                d3.ascending(a.sumDistortion, b.sumDistortion) :
                d3.ascending(a.features[sortMatrixXBy], b.features[sortMatrixXBy])
            );
      
      _self.xMatrixScale.domain(
          _.map(sortedX, (d) => d.idx));
      _self.xAttributeScale.domain(
          d3.extent(instances, (d) => 
            (sortMatrixXBy === 'sumDistortion') ? 
              d.sumDistortion : 
              d.features[sortMatrixXBy]
          ));

      this.setState({ 
        sortMatrixXBy: e.target.value,
        sortMatrixXdropdownValue: sortMatrixXBy
      });

      let dataSelectedPermutationDiffsFlattend = _.flatten(dataSelectedPermutationDiffs);

      // For matrix cells
      d3.selectAll('.g_cell')
          .data(dataSelectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .attr('transform', (d) =>
            'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')'
          );

      // Bottom
      // For Attribute plot on the bottom
      d3.selectAll('.attr_rect_bottom')
          .data(instances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.idx))
          .attr('fill', (d) => {
              return (sortMatrixXBy === 'sumDistortion') ? 
                _self.xAttributeScale(d.sumDistortion) : 
                _self.xAttributeScale(d.features[sortMatrixXBy])
          });

      d3.selectAll('.pair_rect_bottom')
          .data(instances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.idx));

      // For sum distortion plot on the bottom
      d3.selectAll('.sum_distortion_rect_bottom')
          .data(instances)
          .transition()
          .duration(750)
          .attr('x', (d) => _self.xMatrixScale(d.idx) + _self.cellWidth / 2);

      d3.selectAll('.sum_distortion_circle_bottom')
          .data(instances)
          .transition()
          .duration(750)
          .attr('cx', (d) => _self.xMatrixScale(d.idx) + _self.cellWidth / 2);

      this.calculateNDM(dataSelectedPermutationDiffs);
    }

    handleSortingMatrixY(e) {
      let _self = this;

      let sortMatrixYBy = e.target.value,
          data = this.props.data,
          instances = data.instances,
          dataSelectedPermutationDiffs = this.dataSelectedPermutationDiffs;

      const sortedY = _.sortBy(instances, 
              (sortMatrixYBy === 'sumDistortion') ? 
                sortMatrixYBy : 
                'features.'+ sortMatrixYBy
            );
      
      _self.yMatrixScale.domain(
          _.map(sortedY, (d) => d.idx ));
      _self.yAttributeScale.domain(
          d3.extent(_.map(instances, (d) => 
            (sortMatrixYBy === 'sumDistortion') ? 
              d.sumDistortion : 
              d.features[sortMatrixYBy]
          ))
        );

      this.setState({ 
        sortMatrixYBy: e.target.value,
        sortMatrixYdropdownValue: sortMatrixYBy
      });

      let dataSelectedPermutationDiffsFlattend = _.flatten(dataSelectedPermutationDiffs);

      d3.selectAll('.g_cell')
          .data(dataSelectedPermutationDiffsFlattend)
          .transition()
          .duration(750)
          .attr('transform', (d) =>
            'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')'
          );

      // Bottom
      // For Attribute plot on the bottom
      d3.selectAll('.attr_rect_left')
          .data(instances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.idx))
          .attr('fill', (d) => 
            (sortMatrixYBy === 'sumDistortion') ? 
              _self.yAttributeScale(d.sumDistortion) : 
              _self.yAttributeScale(d.features[sortMatrixYBy])
          );

      d3.selectAll('.pair_rect_left')
          .data(instances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.idx));

      // For sum distortion plot on the bottom
      d3.selectAll('.sum_distortion_rect_left')
          .data(instances)
          .transition()
          .duration(750)
          .attr('y', (d) => _self.yMatrixScale(d.idx) + _self.cellWidth / 2);

      d3.selectAll('.sum_distortion_circle_left')
          .data(instances)
          .transition()
          .duration(750)
          .attr('cy', (d) => _self.yMatrixScale(d.idx) + _self.cellWidth / 2);
    }

    handleSelectGroupCheckbox(checked) {
    }

    handleSelectOutlierAndFairCheckbox(checked) {
    }
  
    render() {
      if ((!this.props.data || this.props.data.length === 0) || 
          (!this.state.confIntervalPoints || this.state.confIntervalPoints.length === 0)
         ) {
        return <div />
      }
      let _self = this;

      const dataPairwiseDiffs = this.props.dataPairwiseDiffs;
         
      _self.renderPlot();
      _self.renderMatrix();
      _self.renderLegend();

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
        <div className={styles.IndividualFairnessView}>
          <div className={styles.individualFairnessViewTitleWrapper}>
            <Icon className={styles.step3} type="check-circle" theme="filled" /> &nbsp;
            <div className={index.title + ' ' + styles.individualFairnessViewTitle}>Distortions</div>
          </div>
          <div className={styles.MatrixSelectedInstanceWrapper}>
            <div className={styles.IndividualStatusView}>
              <div className={index.subTitle}>Selected Instance</div>
              <div className={styles.IndividualStatus}>
                <Icon type="user" style={{ fontSize: 50, backgroundColor: 'white', border: '1px solid grey', margin: 5 }}/>
                <span>Index: 1</span>
                {this.renderSelectedInstance()}
              </div>
            </div>
            <div className={styles.MatrixView}>
              <div className={index.subTitle}>Individual Distortions</div>
              <div className={styles.matrixDropdownWrapper}>
                <span>Set distortion by: &nbsp;</span>
                <CheckboxGroup options={colorOptions} defaultValue={[ 'Absolute' ]} onChange={this.handleSelectGroupCheckbox} />
                <span>Sort x axis by: &nbsp;</span>
                <Dropdown className={styles.sortMatrixXdropdown}
                          isOpen={this.state.sortMatrixXdropdownOpen}  size='sm' toggle={this.handleToggleMatrixX}>
                  <DropdownToggle caret>
                    {this.state.sortMatrixXdropdownValue}
                  </DropdownToggle>
                  <DropdownMenu>
                    {this.renderMatrixXDropdownSelections()}
                  </DropdownMenu>
                </Dropdown>
                <span>Sort y axis by: &nbsp;</span>
                <Dropdown className={styles.sortMatrixYdropdown}
                          isOpen={this.state.sortMatrixYdropdownOpen}  size='sm' toggle={this.handleToggleMatrixY}>
                  <DropdownToggle caret>
                    {this.state.sortMatrixYdropdownValue}
                  </DropdownToggle>
                  <DropdownMenu>
                    {this.renderMatrixYDropdownSelections()}
                  </DropdownMenu>
                </Dropdown>
              </div>
              {this.svgMatrix.toReact()}
            </div>
          </div>
          <div className={styles.DistortionPlot}> 
            <div className={index.subTitle}>Pairwise Distortions</div>
            <div className={styles.IndividualFairnessViewBar}>
              <span>Select groups: &nbsp;</span>
              <CheckboxGroup options={groupOptions} defaultValue={['Women', 'Men', 'Between']} onChange={this.handleSelectGroupCheckbox} />
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <CheckboxGroup options={outlierAndFairOptions} defaultValue={[]} onChange={this.handleSelectOutlierAndFairCheckbox} />
              {/* sort by: &nbsp;
              <Dropdown direction='down' className={styles.DistortionSortingDropdown} isOpen={this.state.dropdownOpen}  size='sm' toggle={this.sortDistortion}>
                <DropdownToggle caret>
                  close to far
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem value='pairwiseDistance' onClick={this.handleSelectSorting}>Pairwise distance (close to far)</DropdownItem>
                  <DropdownItem value='distortion' onClick={this.handleSelectSorting}>Distortion (small to large)</DropdownItem>
                </DropdownMenu>
              </Dropdown> */}
            </div>
            <div className={styles.summary}>Group skew: 1.09</div>
            {this.svg.toReact()}
          </div>
        </div>
      );
    }
  }

  export default IndividualFairnessView;