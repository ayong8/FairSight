import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Select, Icon, Table, Tabs, Slider, InputNumber, Tooltip } from 'antd';
import { BeatLoader } from 'react-spinners';


import LegendView from 'components/RankingInspectorView/LegendView';
import FeatureInspectionView from 'components/RankingInspectorView/FeatureInspectionView';
import LocalInspectionView from 'components/RankingInspectorView/LocalInspectionView';
import OutputSpaceView from 'components/RankingInspectorView/OutputSpaceView';
import InputSpaceView from 'components/RankingInspectorView/InputSpaceView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import FairnessBar from '../FairnessBar';
import UtilityBar from '../UtilityBar';

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
        mode: 'GF', // individual fairness
        selectedIntervalForMatrix: {
          from: 1,
          to: 50
        },
        selectedInstance: {},
        selectedInstanceNNs: [],
        nNeighbors: 4,
        rNN: 0,
        rNNGain: 0,
        selectedInstances: [],
        selectedPairwiseDiffs: [],
        selectedPermutationDiffs: [],
        selectedPermutationDiffsFlattened: [],
        sortMatrixDropdownOpen: false,
        sortMatrixXdropdownOpen: false,
        sortMatrixYdropdownOpen: false,
        colorMatrixDropdownOpen: false,
        sortMatrixBy: 'ranking',
        sortMatrixXBy: 'distortion',
        sortMatrixYBy: 'distortion',
        colorMatrixBy: 'pairwise_distortion',
        sortMatrixDropdownValue: 'ranking',
        sortMatrixXdropdownValue: 'features',
        sortMatrixYdropdownValue: 'features',
        colorMatrixDropdownValue: 'Pairwise distortion',
        featureCorrSelections: [ { feature_set: '1 and 2', corr: 0.6 }, { feature_set: '1 and 2', corr: 0.6 } ],
        perturbationResults: [],
        corrBtnOutliersAndWholeInstances: {}
      };

      this.svg;
      this.svgMatrix;
      this.svgPlot;
      this.layout = {
        width: 650,
        height: 300,
        svgMatrix: {
          width: 450,
          height: 400,
          margin: 10,
          matrixPlot: {
            width: 300,
            height: 300
          },
          attrPlotLeft: {
            width: 30,
            height: 300
          },
          attrPlotBottom: {
            width: 300,
            height: 30
          },
          distortionSumPlotUpper: {
            width: 300,
            height: 40
          },
          distortionSumPlotRight: {
            width: 40,
            height: 300
          },
          histoMatrix: {
            width: 70,
            height: 70
          }
        },
        svgPlot: {
          width: 100,
          height: 100,
          margin: 5
        },
        svgSpeceOverview: {
          height: 80
        }
      };

      this.changeFairnessMode = this.changeFairnessMode.bind(this);
      this.toggleMatrix = this.toggleMatrix.bind(this);
      this.toggleMatrixY = this.toggleMatrixY.bind(this);
      this.toggleMatrixColor = this.toggleMatrixColor.bind(this);
      this.handleSortingMatrix = this.handleSortingMatrix.bind(this);
      this.handleSelectGroupCheckbox = this.handleSelectGroupCheckbox.bind(this);
      this.handleSelectOutlierAndFairCheckbox = this.handleSelectOutlierAndFairCheckbox.bind(this);
      this.handleSelectedInstance = this.handleSelectedInstance.bind(this);
      this.handleUnselectedInstance = this.handleUnselectedInstance.bind(this);
    }

    componentWillMount() {
    }

    componentDidMount() {
      const _self = this;
      const { data } = this.props,
            { method, features, instances, sensitiveAttr } = data,
            featureNames = features.map((d) => d.name),
            sensitiveAttrName = sensitiveAttr.name;

      const outliers = instances.filter((d) => d.isOutlier),
            wholeInstances = instances;

      const featureValuesForOutliers = outliers.map((d) => d.features),
            featureValuesForWholeInstances = wholeInstances.map((d) => d.features)

      const corrTestRequest = {
        wholeFeatures: featureNames,
        groupInstances1: featureValuesForOutliers,
        groupInstances2: featureValuesForWholeInstances
      }

      // Calculate the correlation between outliers and whole instances
      fetch('/dataset/calculateWassersteinDistance/', {
        method: 'post',
        body: JSON.stringify(corrTestRequest)
      })
      .then((response) => {
        return response.json();
      })   
      .then((response) => {
        // { FEATURE-NAME: TEST-RESULT, ... }
        const corrTestResult = JSON.parse(response);
        _self.setState({
          corrBtnOutliersAndWholeInstances: corrTestResult
        });
      });

      // Perturb features
      const perturbationResults = [];
      const urlForMethod = (method.name === 'Logistic Regression') ? 'runLRForPerturbation' 
                              : (method.name === 'SVM') ? 'runSVMForPerturbation'
                              : 'runACFForPerturbation'

      const requests = features.map((feature) => ({
                ...data, 
                perturbedFeature: feature.name, 
                isForPerturbation: true 
              }));

      fetch('/dataset/' + urlForMethod + '/', {
        method: 'post',
        body: JSON.stringify(requests)
      })
      .then( (response) => {
        return response.json();
      })   
      .then( (responses) => {
        const perturbedRankingInstances = JSON.parse(responses);
        
        const perturbationResults = perturbedRankingInstances.map((perturbedRankingInstance) => {
                  // Calculate and update measures
                  const { precisionK, sp } = _self.calculateOutputMeasuresForPerturbation(perturbedRankingInstance);
                  perturbedRankingInstance.statForPerturbation.precisionK = precisionK;
                  perturbedRankingInstance.statForPerturbation.sp = sp;

                  return perturbedRankingInstance;
                });
        
        _self.setState({
          perturbationResults: perturbationResults
        });
      });

      _self.setState({
        sortMatrixXBy: 'ranking',
        sortMatrixYBy: 'ranking',
        sortMatrixXdropdownValue: 'ranking',
        sortMatrixYdropdownValue: 'ranking'
      });
    }

    shouldComponentUpdate(nextProps, nextState) {
      const shouldRunModel = nextProps.data.shouldRunModel;
      
      return shouldRunModel;
    }

    componentWillUpdate(nextProps, nextState) {
      if (this.state.seletedInstance !== nextState.selectedInstance)  {
        if (Object.keys(nextState.selectedInstance).length !== 0) {
          d3.selectAll('.distortion_rect_top.selected').style('stroke-width', 0.5).classed('selected', false);
          d3.selectAll('.distortion_rect_top_' + nextState.selectedInstance.idx).style('stroke-width', 3).classed('selected', true);
        }
      }
      if (this.state.seletedInstanceNNs !== nextState.selectedInstanceNNs) {
        let classesForNNs = '';
        nextState.selectedInstanceNNs.forEach((selectedInstanceNN) => {
          if (selectedInstanceNN.ranking2 < this.props.selectedRankingInterval.to) {
            classesForNNs += '.distortion_rect_top_' + selectedInstanceNN.idx2 + ',';
          }
        });
        classesForNNs = classesForNNs.replace(/,\s*$/, '');
        d3.selectAll('.distortion_rect_top.neighbor').style('stroke', 'black').style('stroke-width', 0.5).classed('neighbor', false);
        if (classesForNNs !== '') {
          d3.selectAll(classesForNNs).style('stroke', 'blue').style('stroke-width', 2).classed('neighbor', true);
        }
      }
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevProps.data !== this.props.data){
        const _self = this;

        const { data } = this.props,
              { method, features } = data;
        
        // Perturb features
        const urlForMethod = (method.name === 'Logistic Regression') ? 'runLRForPerturbation' 
                                : (method.name === 'SVM') ? 'runSVMForPerturbation'
                                : 'runACFForPerturbation'

        const requests = features.map((feature) => ({
                  ...data, 
                  perturbedFeature: feature.name, 
                  isForPerturbation: true 
                }));

        fetch('/dataset/' + urlForMethod + '/', {
          method: 'post',
          body: JSON.stringify(requests)
        })
        .then( (response) => {
          return response.json();
        })   
        .then( (responses) => {
          const perturbedRankingInstances = JSON.parse(responses);
          
          const perturbationResults = perturbedRankingInstances.map((perturbedRankingInstance) => {
                    // Calculate and update measures
                    const { precisionK, sp } = _self.calculateOutputMeasuresForPerturbation(perturbedRankingInstance);
                    perturbedRankingInstance.statForPerturbation.precisionK = precisionK;
                    perturbedRankingInstance.statForPerturbation.sp = sp;

                    return perturbedRankingInstance;
                  });
          
          _self.setState({
            perturbationResults: perturbationResults
          });
        });

        _self.setState({
          sortMatrixXBy: 'ranking',
          sortMatrixYBy: 'ranking',
          sortMatrixXdropdownValue: 'ranking',
          sortMatrixYdropdownValue: 'ranking'
        });
      }
    }

    changeFairnessMode(activeKey) { 
      // activeKey: 'individualFairness' or 'groupFairness'
      this.setState({
        mode: activeKey
      });
    }

    handleSelectedInstance(selectedInstanceIdx) {
      const { data } = this.props,
            { instances } = data,
            selectedInstance = instances.filter((d) => d.idx === selectedInstanceIdx)[0];

      const { rNN, rNNGain } = this.calculateRNN(selectedInstance);

      this.setState({
        selectedInstance: selectedInstance,
        selectedInstanceNNs: this.identifyNNs(selectedInstance, 4),
        rNN: rNN,
        rNNGain: rNNGain
      });
    }

    handleUnselectedInstance() {
      this.setState({
        selectedInstance: {},
        selectedInstanceNNs: [],
        rNN: 'Not selected'
      });
    }

    calculateOutputMeasuresForPerturbation(perturbedRankingInstance) {
      const { data, n, topk } = this.props,
            { instances, sensitiveAttr } = perturbedRankingInstance,
            { protectedGroup, nonProtectedGroup, range } = sensitiveAttr;
      let protectedGroupBinary, nonProtectedGroupBinary;

      // For fairness = rND ... or possibly statistical and conditional parity
      if (range[0] === protectedGroup){  // Find the corresponding 0 or 1 to protected or non-protected group string
        protectedGroupBinary = 0;
        nonProtectedGroupBinary = 1;
      } else {
        protectedGroupBinary = 1;
        nonProtectedGroupBinary = 0;
      }

      const group1 = instances.filter((d) => d.group === 0),
            group2 = instances.filter((d) => d.group === 1);

      const groupRanking1 = group1.map((d) => d.ranking),
            groupRanking2 = group2.map((d) => d.ranking);

      const protectedGroupInTopk = instances.filter((d) => d.group === 1 && d.ranking <= topk ),
            protectedGroupInWhole = instances.filter((d) => d.group === 1);

      const nonProtectedGroupInTopk = instances.filter((d) => d.group === 0 && d.ranking <= topk ),
            nonProtectedGroupInWhole = instances.filter((d) => d.group === 0);

      const nProtectedGroupInTopk = protectedGroupInTopk.length,
            nProtectedGroupInWhole = protectedGroupInWhole.length,
            nNonProtectedGroupInWhole = nonProtectedGroupInWhole.length,
            Z = (1 / (Math.log(topk) / Math.log(2))) * Math.abs( (Math.min(nProtectedGroupInWhole, topk) / topk) - (nProtectedGroupInWhole / n) ),
            rND = 1 - (1/Z) * (1 / (Math.log(topk) / Math.log(2))) * Math.abs( (nProtectedGroupInTopk / topk) - (nProtectedGroupInWhole / n) );

      const statisticalParity = (group2.filter((d) => d.ranking <= topk).length / group2.length) / 
                                (group1.filter((d) => d.ranking <= topk).length / group1.length);
      const conditionalParity = (group2.filter((d) => d.ranking <= topk && d.target === 0) / group2.length) / 
                                (group1.filter((d) => d.ranking <= topk && d.target === 0) / group1.length);

      // For utility = nDCG
      const topkInstances = instances.filter((d) => d.ranking <= topk);
      const precisionK = topkInstances.filter((d) => d.target === 0).length / topkInstances.length;

      let GFDCG; 
      if (protectedGroupInTopk.length === 0 || nonProtectedGroupInTopk.length === 0) {
        GFDCG = 5;
      }
      else {
        const DCGForProtectedGroup = protectedGroupInTopk.filter((d) => d.target === 0)
                                                      .map((d) => (n - d.ranking) / n)
                                                      .reduce((acc, curr) => acc + curr) / nProtectedGroupInWhole;
        const DCGForNonProtectedGroup = nonProtectedGroupInTopk.length === 0 ? nonProtectedGroupInTopk.filter((d) => d.target === 0)
                                                                                .map((d) => (n - d.ranking) / n) 
                                                                                .reduce((acc, curr) => acc + curr) / nNonProtectedGroupInWhole
                                                                              : 0;
        GFDCG = DCGForProtectedGroup / DCGForNonProtectedGroup;
      }
      
      
      const DCG = topkInstances.map((d, i) => { // sorted by ranking
                const relevance = d.target;
                const cumulativeDiscount = (topk - d.ranking) / topk;

                return relevance * cumulativeDiscount;
              }).reduce((acc, curr) => acc + curr);

      const IDCG = _.sortBy(topkInstances, 'target').reverse().map((d, i) => {
                const relevance = d.target;
                const cumulativeDiscount = (topk - i) / topk;

                return relevance * cumulativeDiscount;
              }).reduce((acc, curr) => acc + curr);

      const nDCG = DCG / IDCG;

      return {
        utility: Math.round(nDCG * 100) / 100,
        precisionK: Math.round(precisionK * 100) / 100,
        GFDCG: Math.round(GFDCG * 100) / 100,
        rND: Math.round(rND * 100) / 100,
        sp: Math.round(statisticalParity * 100) / 100, 
        cp: Math.round(conditionalParity * 100) / 100
      }
    }

    identifyNNs(selectedInstance, nNeighbors) {
      const { pairwiseDiffs } = this.props;
      const selectedInstanceIdx = selectedInstance.idx;

      const NNs = pairwiseDiffs.filter((d) => {
        return d.idx1 == selectedInstanceIdx;
      }).sort((a, b) => d3.ascending(a.scaledDiffInput, b.scaledDiffInput)).slice(0, nNeighbors);

      return NNs;
    }

    calculateRNN(selectedInstance) {  
      const nNeighbors = 4;
      const NNs = this.identifyNNs(selectedInstance, nNeighbors);

      if (NNs.length === 0)
        return 'NaN';

      const yAbsDiffsForNNs = NNs.map((d) => Math.abs(d.ranking1 - d.ranking2) / Math.max(d.ranking1, d.ranking2)),
            yDiffsForNNs = NNs.map((d) => (d.ranking2 - d.ranking1) / Math.max(d.ranking1, d.ranking2)),
            sumAbsDiffsForNNs = yAbsDiffsForNNs.reduce((acc, curr) => acc + curr),
            sumDiffsForNNs = yDiffsForNNs.reduce((acc, curr) => acc + curr);
  
      const rNN = 1 - (sumAbsDiffsForNNs / nNeighbors),
            rNNGain = sumDiffsForNNs / nNeighbors;
  
      return {
        rNN: rNN,
        rNNGain: rNNGain
      }
    }


    toggleMatrix() {
      this.setState({
        sortMatrixDropdownOpen: !this.state.sortMatrixDropdownOpen
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

    handleSortingMatrix(e) {
      const _self = this;

      const sortMatrixBy = e.target.value,
            { data, topk, selectedRankingInterval,
              permutationDiffsFlattened } = this.props,
            { instances } = data,
            { from, to } = selectedRankingInterval,
            selectedInstances = instances.slice(from, to),
            selectedPermutationDiffsFlattend = _.filter(permutationDiffsFlattened, (d) => 
              (d.ranking1 >= from) && (d.ranking1 <= to) &&
              (d.ranking2 >= from) && (d.ranking2 <= to)
            );

      let sortedInstances = [];

      if (sortMatrixBy === 'ranking') {
        sortedInstances = _.orderBy(selectedInstances, sortMatrixBy);

        _self.xMatrixScale.domain(
          _.map(sortedInstances, (d) => d.ranking));

        _self.yMatrixScale.domain(
          _.map(sortedInstances, (d) => d.ranking));
        
        d3.select(_self.svgMatrix).selectAll('.g_cell')
            .data(selectedPermutationDiffsFlattend)
            .transition()
            .duration(750)
            .attr('transform', (d) =>
              'translate(' + _self.xMatrixScale(d.ranking1) + ',' + _self.yMatrixScale(d.ranking2) + ')'
            );

        d3.select(_self.svgMatrix).selectAll('.distortion_rect_top')
            .data(selectedInstances)
            .transition()
            .duration(750)
            .attr('x', (d) => _self.xMatrixScale(d.ranking));

      } else if (sortMatrixBy === 'group') {
        sortedInstances = _.orderBy(selectedInstances, [sortMatrixBy, 'sumDistortion'], ['asc', 'desc']);

        _self.xMatrixScale.domain(
          _.map(sortedInstances, (d) => d.idx));

        _self.yMatrixScale.domain(
          _.map(sortedInstances, (d) => d.idx));

        d3.selectAll('.g_cell')
            .data(selectedPermutationDiffsFlattend)
            .transition()
            .duration(750)
            .attr('transform', (d) =>
              'translate(' + _self.xMatrixScale(d.idx1) + ',' + _self.yMatrixScale(d.idx2) + ')'
            );

        d3.selectAll('.distortion_rect_top')
            .data(selectedInstances)
            .transition()
            .duration(750)
            .attr('x', (d) => _self.xMatrixScale(d.idx));
      }
      

      _self.setState({ 
        sortMatrixBy: sortMatrixBy,
        sortMatrixDropdownValue: sortMatrixBy
      });
    }

    renderMatrix() {
      const _self = this;

      _self.svgMatrix = new ReactFauxDOM.Element('svg');
  
      _self.svgMatrix.setAttribute('width', _self.layout.svgMatrix.width);
      _self.svgMatrix.setAttribute('height', _self.layout.svgMatrix.height);
      _self.svgMatrix.setAttribute('0 0 200 200');
      _self.svgMatrix.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svgMatrix.setAttribute('class', 'svg_matrix');

      const { mode } = this.state;
      const { data, topk, selectedInstance, selectedRankingInterval,
              permutationDiffs, permutationDiffsFlattened } = this.props,
            { instances } = data,
            { from, to } = selectedRankingInterval,
            distortionMin = d3.extent(permutationDiffsFlattened, (d) => d.distortion)[0],
            distortionMax = d3.extent(permutationDiffsFlattened, (d) => d.distortion)[1],
            selectedInstances = instances.slice(from, to),
            selectedPermutationDiffsFlattend = _.filter(permutationDiffsFlattened, (d) => 
              (d.ranking1 >= from) && (d.ranking1 <= to) &&
              (d.ranking2 >= from) && (d.ranking2 <= to)
            );

      _self.dataBinFlattened = _.flatten(_self.dataBin);
      _self.xMatrixScale = d3.scaleBand()
          .domain(_.map(selectedInstances, (d) => d.ranking))  // For now, it's just an index of items(from observed)
          .range([0, _self.layout.svgMatrix.matrixPlot.width]);
      _self.yMatrixScale = d3.scaleBand()
          .domain(_.map(selectedInstances, (d) => d.ranking))  // For now, it's just an index of items(from observed)
          .range([0, _self.layout.svgMatrix.matrixPlot.height]);
      _self.cellWidth = _self.xMatrixScale.bandwidth();
      _self.cellHeight = _self.yMatrixScale.bandwidth();
      _self.distortionScale = d3.scaleLinear()
          .domain([distortionMin, (distortionMin + distortionMax)/2, distortionMax])
          .range(['slateblue', 'white', 'palevioletred']);
      _self.absDistortionScale = d3.scaleLinear()
          .domain([0, d3.max(selectedPermutationDiffsFlattend, (d) => d.absDistortion)])
          .range(['white', gs.individualPairColor]);
      _self.absDistortionBtnPairsScale = d3.scaleLinear()
          .domain([0, d3.max(selectedPermutationDiffsFlattend, (d) => d.absDistortion)])
          .range(['white', gs.betweenGroupPairColor]);
      _self.absDistortionWtnPairsScale = d3.scaleLinear()
          .domain([0, d3.max(selectedPermutationDiffsFlattend, (d) => d.absDistortion)])
          .range(['white', gs.withinGroupPairColor]);
      _self.sumDistortionScale = d3.scaleLinear()
          .domain([0, d3.max(selectedInstances, (d) => d.sumDistortion)])
          .range([5, _self.layout.svgMatrix.distortionSumPlotRight.width - 10]);
      _self.sumDistortionColorScale = d3.scaleLinear()
          .domain([0, d3.max(selectedInstances, (d) => d.sumDistortion)])
          .range(['white', gs.individualPairColor]);

      const xRankingAxis = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_x_matrix_axis')
                .attr('transform', 'translate(' + (_self.layout.svgMatrix.attrPlotLeft.width) + ',' + (_self.layout.svgMatrix.distortionSumPlotUpper.height + _self.layout.svgMatrix.matrixPlot.height) + ')')
                .call(d3.axisBottom(_self.xMatrixScale).tickSize(0).tickValues([1, topk, to]));

      const yRankingAxis = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_y_matrix_axis')
                .attr('transform', 'translate(' + (_self.layout.svgMatrix.attrPlotLeft.width) + ',' + _self.layout.svgMatrix.distortionSumPlotUpper.height + ')')
                .call(d3.axisLeft(_self.yMatrixScale).tickSize(0).tickValues([1, topk, to]));

      const gMatrix = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_matrix')
                .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',' + _self.layout.svgMatrix.distortionSumPlotUpper.height + ')'),
            gCells = gMatrix.selectAll('.g_cell')
                .data(selectedPermutationDiffsFlattend)
                .enter().append('g')
                .attr('class', 'g_cell')
                .attr('transform', function(d){
                  return 'translate(' + _self.xMatrixScale(d.ranking1) + ',' + _self.yMatrixScale(d.ranking2) + ')';
                }),
            gDistortionPlotTop = d3.select(_self.svgMatrix).append('g')
                .attr('class', 'g_distortion_plot_x')
                .attr('transform', 'translate(' + _self.layout.svgMatrix.attrPlotLeft.width + ',0)');                                           

      const selectedIntervalRect = gMatrix.append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', _self.layout.svgMatrix.matrixPlot.width)
              .attr('height', _self.layout.svgMatrix.matrixPlot.height)
              .style('fill', 'none')
              .style('stroke', 'skyblue')
              .style('stroke-width', 2);

      const topkRect = gMatrix.append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', _self.xMatrixScale(topk))
              .attr('height', _self.yMatrixScale(topk))
              .style('fill', 'none')
              .style('stroke', 'blue')
              .style('stroke-width', 2);

      // For Matrix plot
      gCells.append('rect')
          .attr('class', 'pair_rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', _self.cellWidth)
          .attr('height', _self.cellHeight)
          .style('fill', (d) => {
            const pair = d.pair,
                  absDistortion = d.absDistortion;
            
            return (mode === 'IF') ? _self.absDistortionScale(absDistortion)
                  : (mode === 'GF' && pair === 3) ? _self.absDistortionBtnPairsScale(absDistortion)
                  : _self.absDistortionWtnPairsScale(absDistortion);
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

            return 'whitesmoke';
          })
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3)
          .on('mouseover', (d) => {
          });
      // Distortion plot top
      gDistortionPlotTop.selectAll('.distortion_rect_top')
          .data(selectedInstances)
          .enter().append('rect')
          .attr('class', (d, i) => 'distortion_rect_top distortion_rect_top_'+ d.idx)
          .attr('x', (d) => _self.xMatrixScale(d.ranking))
          .attr('y', (d) => 35 - _self.sumDistortionScale(d.sumDistortion))
          .attr('width', _self.xMatrixScale.bandwidth() - 1)
          .attr('height', (d) => _self.sumDistortionScale(d.sumDistortion))
          .attr('fill', (d) => 
              (mode === 'IF') ? gs.individualColor : 
              (mode === 'GF' && d.group === 0) ? gs.groupColor1 : gs.groupColor2
          )
          .attr('stroke', 'none')
          .attr('stroke-width', 0.4)
          .on('mouseover', (d) => {
          })

      // // For histo matrix
      // gHistoCells.append('rect')
      //     .attr('class', 'histo_rect')
      //     .attr('x', 0)
      //     .attr('y', 0)
      //     .attr('width', _self.cellHistoWidth)
      //     .attr('height', _self.cellHistoHeight)
      //     .style('fill', (d) => _self.sumAbsDistortionScale(d.sumAbsDistortion))
      //     .style('stroke', (d) => 'black')
      //     .style('shape-rendering', 'crispEdge')
      //     .style('stroke-width', 0.3);

      // gHistoMatrix.append('rect')
      //     .attr('class', 'histo_selected_area')
      //     .attr('x', 0)
      //     .attr('y', 0)
      //     .attr('width', _self.xHistoMatrixScale(2) - _self.xHistoMatrixScale(0))
      //     .attr('height', _self.yHistoMatrixScale(0) - _self.yHistoMatrixScale(2))
      //     .style('fill', (d) => '#8BC34A')
      //     .style('fill-opacity', 0.5)
      //     .style('stroke', (d) => 'black')
      //     .style('stroke-dasharray', '2,2')
      //     .style('shape-rendering', 'crispEdge')
      //     .style('stroke-width', 0.3);
    }

    handleSelectGroupCheckbox(checked) {
    }

    handleSelectOutlierAndFairCheckbox(checked) {
    }

    renderSortingOptions() {
      const _self = this;

      return ['ranking', 'group'].map((option, idx) => 
        (<DropdownItem
            key={idx}
            value={option} 
            onClick={_self.handleSortingMatrix}>
            {option}
        </DropdownItem>));
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

    renderSpaceOverview() {
      const _self = this;

      const { mode } = this.state;
      const { data, topk, selectedInstance, selectedRankingInterval,
              selectedPermutationDiffsFlattend, permutationDiffs, permutationDiffsFlattened } = this.props,
            { instances, stat } = data,
            { inputSpaceDist, utility, goodnessOfFairness, 
              rNNSum, rNNSumNonProtectedGroup, rNNSumProtectedGroup, GFDCG, groupSkew, sp, cp } = stat,
            { from, to } = selectedRankingInterval,
            selectedInstances = instances.slice(from, to),
            distortionMin = d3.extent(permutationDiffsFlattened, (d) => d.distortion)[0],
            distortionMax = d3.extent(permutationDiffsFlattened, (d) => d.distortion)[1];

      const inputMeasure = (mode === 'GF') ?
                              (<div className={styles.mappingGroupFairnessWrapper}>
                                <div 
                                  className={styles.mappingGroupFairnessTitle} 
                                  onMouseOver={this.handleMouseOverGroupFairness}
                                  onMouseOut={this.handleMouseOverGroupFairness}
                                >Input Distance
                                  <Tooltip placement="topLeft" title="Group separation">
                                    <Icon 
                                      type="question-circle" 
                                      theme="twoTone"
                                      style={{ fontSize: '15px', verticalAlign: 'text-top', margin: '0 5px' }} 
                                    />
                                  </Tooltip>
                                </div>
                                <div className={styles.mappingGroupFairness}>
                                  <UtilityBar
                                    measure={Math.round(inputSpaceDist * 1000) / 1000}
                                    measureDomain={[0, 1]}
                                    perfectScore={1}
                                    color={gs.utilityColor}
                                  />
                                </div>
                              </div>) :
                            (mode === 'IF') ?
                              (<div></div>) : 
                              (<div></div>);

      const mappingMeasure = (mode === 'GF') ?
                              (<div className={styles.mappingGroupFairnessWrapper}>
                                <div 
                                  className={styles.mappingGroupFairnessTitle} 
                                  onMouseOver={this.handleMouseOverGroupFairness}
                                  onMouseOut={this.handleMouseOverGroupFairness}
                                >Group Skew &nbsp;&nbsp;&nbsp; </div>
                                <div className={styles.mappingGroupFairness}>
                                  <FairnessBar
                                    measure={groupSkew}
                                    measureDomain={[0.5, 1.5]}
                                    perfectScore={1}
                                    color={gs.utilityColor}
                                  />
                                </div>
                              </div>) :
                            (mode === 'IF') ?
                              (<div className={styles.individualFairnessWrapper}>
                                <div 
                                  className={styles.individualFairnessTitle} 
                                  onMouseOver={this.handleMouseOverIndividualFairness}
                                  onMouseOut={this.handleMouseOverIndividualFairness}
                                >Goodness of Fairness</div>
                                <div className={styles.individualFairness}>{Math.round(rNNSum * 100) + '%'}</div>
                              </div>) : 
                              (<div></div>);

      const outputMeasure = (mode === 'GF') ?
                                (<div className={styles.outputGroupFairnessWrapper}>
                                  <div 
                                    className={styles.outputGroupFairnessTitle} 
                                    onMouseOver={this.handleMouseOverGroupFairness}
                                    onMouseOut={this.handleMouseOverGroupFairness}
                                    >Fairness</div>
                                  <div className={styles.outputGroupFairness}>
                                    <FairnessBar
                                      measure={Math.round(GFDCG * 100) / 100}
                                      measureDomain={[0, 2]}
                                      perfectScore={1}
                                    />
                                  </div>
                                </div>) :
                            (mode === 'IF') ?
                                (<div></div>) : 
                                (<div></div>);

      return (
        <div className={styles.spaceOverview}>
          <div className={styles.inputSpaceTitle}>INPUT SPACE</div>
          <div className={styles.inputSpaceDescription}></div>
          <div className={styles.inputSpaceMeasure}>{inputMeasure}</div>
          <div className={styles.mappingSpaceTitle}>MAPPING</div>
          <div className={styles.mappingSpaceDescription}></div>
          <div className={styles.mappingSpaceMeasure}>{mappingMeasure}</div>
          <div className={styles.outputSpaceTitle}>OUTPUT SPACE</div>
          <div className={styles.outputSpaceDescription}></div>
          <div className={styles.outputSpaceMeasure}>{outputMeasure}</div>
          <div className={styles.intervalSpace1}>
            <Icon type="right-circle" theme="twoTone" />
          </div>
          <div className={styles.intervalSpace2}>
            <Icon type="right-circle" theme="twoTone" />
          </div>
        </div>
      );
    }

    renderRankingInspector(mode){ // mode == 'IF' (individual fairness), 'GF' (group fairness)
      const _self = this;

      const Option = Select.Option;

      return (
        <div className={styles.IndividualFairnessView}>
          <div className={styles.inspectorWrapper}>
            <div className={styles.SpaceView}>
              <div className={styles.spaceViewTitleWrapper}>
                <div className={styles.spaceViewTitle + ' ' + index.title}>Global Inspector</div>
              </div>
              {_self.renderSpaceOverview()}
              <LegendView 
                className={styles.LegendView}
                mode={mode}
                absDistortionWtnPairsScale={_self.absDistortionWtnPairsScale}
                absDistortionBtnPairsScale={_self.absDistortionBtnPairsScale}
              />
              <OutputSpaceView 
                  className={styles.OutputSpaceView}
                  mode={mode}
                  data={_self.props.data}
                  topk={_self.props.topk}
                  selectedInstance={_self.state.selectedInstance}
                  selectedInstanceNNs={_self.state.selectedInstanceNNs}
                  nNeighbors={_self.state.nNeighbors}
                  selectedInstances={_self.props.selectedInstances}
                  selectedRankingInterval={_self.props.selectedRankingInterval}
                  onSelectedInstance={_self.handleSelectedInstance}
                  onUnselectedInstance={_self.handleUnselectedInstance} 
              />
              <InputSpaceView 
                  className={this.props.isModelRunning ? styles.InputSpaceView + ' ' + index.isModelRunning : styles.InputSpaceView}
                  isModelRunning={_self.props.isModelRunning}
                  mode={mode}
                  data={_self.props.data}
                  topk={_self.props.topk}
                  inputCoords={_self.props.inputCoords}
                  selectedInstance={_self.state.selectedInstance}
                  selectedInstanceNNs={_self.state.selectedInstanceNNs}
                  nNeighbors={_self.state.nNeighbors}
                  selectedInstances={_self.props.selectedInstances}
                  selectedRankingInterval={_self.props.selectedRankingInterval}
                  onSelectedInstance={_self.handleSelectedInstance}
                  onUnselectedInstance={_self.handleUnselectedInstance}
              />
              <div className={styles.MatrixWrapper}>
                <div className={styles.dropdownWrapper}>
                  <Dropdown 
                    isOpen={_self.state.sortMatrixDropdownOpen}  
                    size='sm' 
                    toggle={_self.toggleMatrix}
                  >
                    <DropdownToggle caret>
                      {_self.state.sortMatrixDropdownValue}
                    </DropdownToggle>
                    <DropdownMenu>
                      {_self.renderSortingOptions()}
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <div className={styles.MatrixView}>
                  {_self.svgMatrix.toReact()}
                </div>
              </div>
            </div>
            <LocalInspectionView
                className={styles.LocalInspectionView}
                rankingInstance={_self.props.data}
                topk={_self.props.topk}
                features={_self.props.data.features}
                selectedInstance={_self.state.selectedInstance}
                selectedInstanceNNs={_self.state.selectedInstanceNNs}
                selectedRankingInterval={_self.props.selectedRankingInterval}
                rNN={_self.state.rNN}
                rNNGain={_self.state.rNNGain}
            />
          </div>
          <div className={styles.InspectionComponentsView}>
            <FeatureInspectionView
                className={this.props.isModelRunning ? styles.FeatureInspectionView + ' ' + index.isModelRunning : styles.FeatureInspectionView}
                data={_self.props.data}
                topk={_self.props.topk}
                selectedInstances={_self.props.selectedInstances}
                selectedRankingInterval={_self.props.selectedRankingInterval}
                corrBtnOutliersAndWholeInstances={_self.state.corrBtnOutliersAndWholeInstances}
                perturbationResults={_self.state.perturbationResults}
            />
          </div>
        </div>
      );
    }
  
    render() {
      console.log('RankingInspectorView rendered');
      if ((!this.props.data || this.props.data.length === 0) || 
          (!this.props.data.features || this.props.data.features.length === 0) || 
          (!this.props.permutationDiffs || this.props.permutationDiffs.length === 0) ||
          (!this.props.permutationDiffsFlattened || this.props.permutationDiffsFlattened.length === 0)
         ) {
        return <div />
      }
      const _self = this;
      const TabPane = Tabs.TabPane;
      const { mode } = this.state;
         
      _self.renderMatrix();

      const columns = [
        { title: 'Feature set', dataIndex: 'feature_set', key: 1, width: 100 },
        { title: 'Correlation', dataIndex: 'correlation', key: 2 }
      ];

      return (
        <div className={styles.RankingInspectorView}>
          <Tabs 
            onChange={this.changeFairnessMode} 
            type="card"
            activeKey={this.state.mode}
          >
            <TabPane tab="Individual Fairness" key="IF">{this.renderRankingInspector(mode)}</TabPane>
            <TabPane tab="Group Fairness" key="GF">{this.renderRankingInspector(mode)}</TabPane>
          </Tabs>
        </div>
      );
    }
  }

  export default RankingInspectorView;