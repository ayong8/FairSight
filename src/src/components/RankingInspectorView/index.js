import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Select, Icon, Table, Tabs, Slider, InputNumber } from 'antd';

import LegendView from 'components/RankingInspectorView/LegendView';
import FeatureInspectionView from 'components/RankingInspectorView/FeatureInspectionView';
import IndividualInspectionView from 'components/RankingInspectorView/IndividualInspectionView';
import OutputSpaceView from 'components/RankingInspectorView/OutputSpaceView';
import InputSpaceView from 'components/RankingInspectorView/InputSpaceView';

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
        mode: 'GF', // individual fairness
        selectedIntervalForMatrix: {
          from: 1,
          to: 50
        },
        selectedInstance: {},
        selectedInstanceNNs: [],
        nNeighbors: 4,
        xNN: 'Not selected',
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
      fetch('/dataset/calculateAndersonDarlingTest/', {
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
      if (this.props.seletedInstance !== nextProps.selectedInstance)  {
        d3.select('distortion_rect_top_' + nextProps.selectedInstance.idx)
          .style('stroke-width', 2);
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

      console.log('in handleselected: ', selectedInstanceIdx);
      console.log('in handleselected: ', selectedInstance);

      this.setState({
        selectedInstance: selectedInstance,
        selectedInstanceNNs: this.identifyNNs(selectedInstance, 4),
        xNN: this.calculateXNN(selectedInstance),
      });
    }

    handleUnselectedInstance() {
      this.setState({
        selectedInstance: {},
        selectedInstanceNNs: [],
        xNN: 'Not selected'
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
      const conditionalParity = (group2.filter((d) => d.ranking <= topk && d.target === 1) / group2.length) / 
                                (group1.filter((d) => d.ranking <= topk && d.target === 1) / group1.length);

      // For utility = nDCG
      const topkInstances = instances.filter((d) => d.ranking <= topk);
      const precisionK = topkInstances.filter((d) => d.target === 1).length / topkInstances.length;

      let GFDCG; 
      if (protectedGroupInTopk.length === 0 || nonProtectedGroupInTopk.length === 0) {
        GFDCG = 5;
      }
      else {
        const DCGForProtectedGroup = protectedGroupInTopk.map((d) => d.target * (n - d.ranking) / n)
                                                      .reduce((acc, curr) => acc + curr) / nProtectedGroupInWhole;
        const DCGForNonProtectedGroup = nonProtectedGroupInTopk.length === 0 ? nonProtectedGroupInTopk.map((d) => d.target * (n - d.ranking) / n) 
                                                                                .reduce((acc, curr) => acc + curr) / nNonProtectedGroupInWhole
                                                                              : 
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
      }).sort((a, b) => d3.descending(a.scaledDiffInput, b.scaledDiffInput)).slice(0, nNeighbors);

      return NNs;
    }

    calculateXNN(selectedInstance) {  
      const nNeighbors = 4;
      const NNs = this.identifyNNs(selectedInstance, nNeighbors);

      if (NNs.length === 0)
        return 'NaN';

      const yDiffsForNNs = NNs.map((d) => Math.abs(d.ranking1 - d.ranking2) / Math.max(d.ranking1, d.ranking2)),
            sumDiffsForNNs = yDiffsForNNs.reduce((acc, curr) => acc + curr);
  
      const rNN = sumDiffsForNNs / nNeighbors;
  
      return rNN;
  
      // idx1: pairs[i][0].idx,
      // idx2: pairs[i][1].idx,
      // ranking1: pairs[i][0].instance.ranking,
      // ranking2: pairs[i][1].instance.ranking,
      // x1: pairs[i][0].instance,
      // x2: pairs[i][1].instance,
      // pair: pair,
      // diffInput: diffInput,
      // diffOutput: diffOutput,
      // scaledDiffInput: _self.inputScale(diffInput),
      // scaledDiffOutput: _self.outputScale(diffOutput),
      // distortion: _self.outputScale(diffOutput) - _self.inputScale(diffInput),
      // absDistortion: Math.abs(_self.outputScale(diffOutput) - _self.inputScale(diffInput)),
      // isFair: false,
      // isOutlier: false
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

    // handleSortingMatrixY(e) {
    //   const _self = this;

    //   const sortMatrixYBy = e.target.value,
    //         { data } = this.props,
    //         { selectedInstances, selectedPermutationDiffsFlattend } = this.props;

    //   const sortedY = _.sortBy(selectedInstances, 
    //           (sortMatrixYBy === 'sumDistortion') ? sortMatrixYBy 
    //           : (sortMatrixYBy === 'ranking') ? sortMatrixYBy 
    //           : 'features.'+ sortMatrixYBy
    //         );
      
    //   _self.yMatrixScale.domain(
    //       _.map(sortedY, (d) => d.ranking));
    //   _self.yAttributeScale.domain(
    //         d3.extent(selectedInstances, (d) => 
    //           (sortMatrixYBy === 'sumDistortion') ? d.sumDistortion
    //           : (sortMatrixYBy === 'ranking') ? d.ranking
    //           : d.features[sortMatrixYBy]
    //       ));

    //   this.setState({ 
    //     sortMatrixYBy: e.target.value,
    //     sortMatrixYdropdownValue: sortMatrixYBy
    //   });

    //   d3.selectAll('.g_cell')
    //       .data(selectedPermutationDiffsFlattend)
    //       .transition()
    //       .duration(750)
    //       .attr('transform', (d) =>
    //         'translate(' + _self.xMatrixScale(d.ranking1) + ',' + _self.yMatrixScale(d.ranking2) + ')'
    //       );

    //   // Bottom
    //   // For Attribute plot on the bottom
    //   d3.selectAll('.attr_rect_left')
    //       .data(selectedInstances)
    //       .transition()
    //       .duration(750)
    //       .attr('y', (d) => _self.yMatrixScale(d.ranking))
    //       .attr('fill', (d) => 
    //         (sortMatrixYBy === 'sumDistortion') ? _self.yAttributeScale(d.sumDistortion)
    //         : (sortMatrixYBy === 'ranking') ? _self.yAttributeScale(d.ranking)
    //         : _self.yAttributeScale(d.features[sortMatrixYBy])
    //       );

    //   d3.selectAll('.pair_rect_left')
    //       .data(selectedInstances)
    //       .transition()
    //       .duration(750)
    //       .attr('y', (d) => _self.yMatrixScale(d.ranking));

    //   // For sum distortion plot on the bottom
    //   d3.selectAll('.sum_distortion_rect_left')
    //       .data(selectedInstances)
    //       .transition()
    //       .duration(750)
    //       .attr('y', (d) => _self.yMatrixScale(d.ranking) + _self.cellWidth / 2);

    //   d3.selectAll('.sum_distortion_circle_left')
    //       .data(selectedInstances)
    //       .transition()
    //       .duration(750)
    //       .attr('cy', (d) => _self.yMatrixScale(d.ranking) + _self.cellWidth / 2);
      
    //   //this.props.onCalculateNDM(this.selectedPermutationDiffsFlattend);
    // }

    // handleColoringMatrix(e) {
    //   const _self = this;

    //   const colorMatrixBy = e.target.value,
    //         { data } = this.props,
    //         { selectedInstances, selectedPermutationDiffsFlattend } = this.props;

    //   this.setState({ 
    //     colorMatrixYBy: colorMatrixBy,
    //     colorMatrixDropdownValue: colorMatrixBy
    //   });

    //   if (colorMatrixBy === 'pairwise_distortion') {
    //     d3.selectAll('.pair_rect')
    //       // .data(selectedPermutationDiffsFlattend)
    //       .transition()
    //       .duration(750)
    //       .style('fill', (d) => {
    //         if (d.pair === 3)
    //           return _self.absDistortionBtnPairsScale(d.absDistortion);
    //         else
    //           return _self.absDistortionWtnPairsScale(d.absDistortion);
    //       });
    //   } else if (colorMatrixBy === 'pairwise_distortion') {
    //     d3.selectAll('.pair_rect')
    //       // .data(selectedPermutationDiffsFlattend)
    //       .transition()
    //       .duration(750)
    //       .style('fill', (d) => {
    //           return _self.absDistortionBtnPairsScale(d.absDistortion);
    //       });
    //   }
    // }

    // renderMatrixXDropdownSelections() {
    //   const { data } = this.props,
    //         { features } = data;

    //   const featureNames = features
    //           .map((d) => d.name)
    //           .concat('sumDistortion', 'ranking');

    //   return featureNames.map((feature, idx) => 
    //       (<DropdownItem
    //           key={idx}
    //           value={feature} 
    //           onClick={this.handleSortingMatrixX}>
    //           {feature}
    //       </DropdownItem>));
    // }

    // renderMatrixYDropdownSelections() {
    //   const { data } = this.props,
    //         { features } = data;

    //   const featureNames = features
    //           .map((d) => d.name)
    //           .concat('sumDistortion', 'ranking');

    //   return featureNames.map((feature, idx) => 
    //       (<DropdownItem 
    //           key={idx}
    //           value={feature} 
    //           onClick={this.handleSortingMatrixY}>
    //           {feature}
    //       </DropdownItem>));
    // }

    // renderMatrixColorDropdownSelections() {
    //   const matrixColorOptions = [ 'pairwise_distortion', 'bewteen_within_group_pairs' ];

    //   return matrixColorOptions.map((option, idx) => 
    //       (<DropdownItem
    //           key={idx}
    //           value={option} 
    //           onClick={this.handleColoringMatrix}>
    //           {option}
    //       </DropdownItem>));
    // }

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

      // let dataX = instances,
      //     dataY = instances,
      //     dataSelectedX = selectedInstances,
      //     dataSelectedY = selectedInstances;

      // const nDataPerAxis = this.props.n,  // # of data points per axis
      //       nBinPerAxis = 10,             // nBinPerAxis == nXBin == nYBin
      //       nDataPerBin = Math.round(nDataPerAxis / nBinPerAxis);

      // // For bins for whole histogram
      // for (let i=0; i<nBinPerAxis; i++) {
      //   _self.dataBin[i] = [];
      //   for (let j=0; j<nBinPerAxis; j++) {
      //     _self.dataBin[i][j] = {};
      //     _self.dataBin[i][j].sumAbsDistortion = 0;
      //     _self.dataBin[i][j].idx1 = i;
      //     _self.dataBin[i][j].idx2 = j;

      //     for (let k=i*nDataPerBin; k<(i+1)*nDataPerBin; k++) {
      //       for (let l=j*nDataPerBin; l<(j+1)*nDataPerBin; l++) {
      //         _self.dataBin[i][j].sumAbsDistortion += permutationDiffs[k][l].absDistortion;
      //       }
      //     }
      //   }
      // }

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
      // _self.xAttributeScale = d3.scaleLinear()
      //     .domain(d3.extent(dataX, (d) => d.features[Object.keys(d.features)[0]]))
      //     .range(['white', '#003569']);
      // _self.yAttributeScale = d3.scaleLinear()
      //     .domain(d3.extent(dataY, (d) => d.features[Object.keys(d.features)[0]]))
      //     .range(['white', '#003569']);

      // // For sum heatmap matrix
      // _self.xHistoMatrixScale = d3.scaleBand()
      //     .domain(d3.range(nBinPerAxis))  // For now, it's just an index of items(from observed)
      //     .range([0, _self.layout.svgMatrix.histoMatrix.width]);
      // _self.yHistoMatrixScale = d3.scaleBand()
      //     .domain(d3.range(nBinPerAxis))  // For now, it's just an index of items(from observed)
      //     .range([_self.layout.svgMatrix.distortionSumPlotUpper.height, 
      //             _self.layout.svgMatrix.histoMatrix.height + _self.layout.svgMatrix.distortionSumPlotUpper.height]);
      // _self.cellHistoWidth = _self.xHistoMatrixScale.bandwidth();
      // _self.cellHistoHeight = _self.yHistoMatrixScale.bandwidth();
      // _self.sumAbsDistortionScale = d3.scaleLinear()
      //     .domain(d3.extent(_self.dataBinFlattened, (d) => d.sumAbsDistortion))
      //     .range(['white', 'indigo']);

      // //*** Initial sort
      // // Sort x or y data (Sort by the feature & add sorting index)
      // const sortMatrixXBy = 'ranking',
      //       sortMatrixYBy = 'ranking';

      // let sortedSelectedX = [...dataSelectedX].sort((a, b) => d3.ascending(a.ranking, b.ranking)),
      //     sortedSelectedY = [...dataSelectedY].sort((a, b) => d3.ascending(a.ranking, b.ranking));

      // _self.xMatrixScale
      //     .domain(_.map(sortedSelectedX, (d) => d.ranking));
      // _self.yMatrixScale
      //     .domain(_.map(sortedSelectedY, (d) => d.ranking));
      // _self.xAttributeScale
      //     .domain(d3.extent(sortedSelectedX, (d) => 
      //       sortMatrixXBy === 'sumDistortion' ? d.sumDistortion 
      //       : sortMatrixXBy === 'ranking' ? d.ranking
      //       : d.features[ sortMatrixXBy ]
      //     ));
      // _self.yAttributeScale
      //     .domain(d3.extent(sortedSelectedY, (d) => 
      //       sortMatrixYBy === 'sumDistortion' ? d.sumDistortion 
      //       : sortMatrixYBy === 'ranking' ? d.ranking
      //       : d.features[ sortMatrixYBy ]
      //     ));

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
            // gHistoMatrix = d3.select(_self.svgMatrix).append('g')
            //     .attr('class', 'g_histo_matrix')
            //     .attr('transform', 'translate(' + (_self.layout.svgMatrix.attrPlotLeft.width + _self.layout.svgMatrix.matrixPlot.width + 20) + ',0)'),
            // gHistoCells = gHistoMatrix.selectAll('.g_histo_cell')
            //     .data(_self.dataBinFlattened)
            //     .enter().append('g')
            //     .attr('class', 'g_histo_cell')
            //     .attr('transform', function(d){
            //       return 'translate(' + _self.xHistoMatrixScale(d.idx1) + ',' + _self.yHistoMatrixScale(d.idx2) + ')';
            //     });
                                
      // Top-k line
      // if (sortMatrixXBy === 'ranking') {
      //   const topkRect = gMatrix.append('rect')
      //           .attr('x1', _self.xMatrixScale(topk))
      //           .attr('y1', _self.yMatrixScale(1))
      //           .attr('x2', _self.xMatrixScale(topk))
      //           .attr('y2', _self.yMatrixScale(to))
      //           .style('stroke', 'red')
      //           .style('stroke-width', 1);
      // }
      // if (sortMatrixYBy === 'ranking') {
      //   const topkLineY = gMatrix.append('line')
      //           .attr('x1', _self.xMatrixScale(1))
      //           .attr('y1', _self.yMatrixScale(topk))
      //           .attr('x2', _self.xMatrixScale(to))
      //           .attr('y2', _self.yMatrixScale(topk))
      //           .style('stroke', 'red')
      //           .style('stroke-width', 1);
      // }

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

            return 'black';
          })
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3)
          .on('mouseover', (d) => {
            //console.log(d.absDistortion);
          });

      // console.log('sortedSelectedX: ', sortedSelectedX.map((d) => d.sumDistortion));
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
          .attr('stroke', 'black')
          .attr('stroke-width', 0.4)
          .on('mouseover', (d) => {
            //console.log('distortion_sum: ', d.sumDistortion, d.ranking);
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
            { inputSpaceDist, utility, goodnessOfFairness, rNNSum, GFDCG, groupSkew, sp, cp } = stat,
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
                                >Input Distance</div>
                                <div className={styles.mappingGroupFairness}>{Math.round(inputSpaceDist * 1000) / 1000}</div>
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
                                >GroupSkew</div>
                                <div className={styles.mappingGroupFairness}>{groupSkew}</div>
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
                                  <div className={styles.outputGroupFairness}>{Math.round(GFDCG * 100) / 100}</div>
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
                <div className={styles.spaceViewTitle + ' ' + index.subTitle}>Global Inspector</div>
              </div>
              {_self.renderSpaceOverview()}
              <LegendView 
                className={styles.LegendView} 
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
                  className={styles.InputSpaceView}
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
            <IndividualInspectionView
                className={styles.IndividualInspectionView}
                data={_self.props.rankingInstance}
                topk={_self.props.topk}
                selectedInstance={_self.state.selectedInstance}
                selectedRankingInterval={_self.props.selectedRankingInterval}
                xNN={_self.state.xNN}
            />
          </div>
          <div className={styles.InspectionComponentsView}>
            <FeatureInspectionView
                className={styles.FeatureInspectionView}
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