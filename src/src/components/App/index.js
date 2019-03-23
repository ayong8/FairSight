import React, { Component } from "react";
import { connect } from 'react-redux';
import * as d3 from 'd3';
import _ from 'lodash';
import { Tooltip } from 'react-svg-tooltip';
import { BeatLoader } from 'react-spinners';
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Button } from 'antd';

import styles from "./styles.scss";
import index from '../../index.css';
import 'antd/dist/antd.css';

import Menubar from 'components/Menubar';
import Generator from 'components/Generator';
import RankingView from 'components/RankingView';
import RankingInspectorView from 'components/RankingInspectorView';
import RankingsListView from 'components/RankingsListView';
import Footer from "components/Footer";


import { Tracker } from 'react-tracker';

function pairwise(list) {
  if (list.length < 2) { return []; }
  var first = list[0],
      rest  = list.slice(1),
      pairs = rest.map(function (x) { return [first, x]; });
  return pairs.concat(pairwise(rest));
}

class App extends Component {
  constructor(props) {
    super(props);

    this.inputScale;
    this.outputScale;

    this.selectedInstances = [];
    this.pairwiseDiffs = [];
    this.selectedPairwiseDiffs = [];
    this.permutationDiffs = [];
    this.selectedPermutationDiffs = [];
    this.permutationDiffsFlattened = [];
    this.selectedPermutationDiffsFlattend = [];
    this.rSquared;

    this.state = {
      isModelRunning: false,
      dataset: [],
      features: [],
      numericalFeatures: ['age_in_years', 'duration_in_month', 'credit_amount'],
      ordinalFeatures: ['savings', 'installment_as_income_perc', 'present_residence_since',	
                        'number_of_existing_credits_at_this_bank',	'marriage',
                        'other_debtors', 'status_of_existing_checking_account',	'property',
                        'other_installment_plans', 'housing'],
      corrBtnSensitiveAndAllFeatures: {},
      methods: [
        {name: 'RankSVM', spec: { Q1: 'A', Q2: '', Q3: '', Q4: '' }},
        {name: 'SVM', spec: { Q1: 'A', Q2: '', Q3: '', Q4: '' }},
        {name: 'Logistic Regression', spec: { Q1: 'A', Q2: '', Q3: '', Q4: '' }},
        {name: 'Additive Counterfactual Fairness', spec: { Q1: 'F', Q2: 'B', Q3: 'Yes', Q4: 'No' }},
        {name: 'Reranking', spec: { Q1: 'F', Q2: 'B', Q3: 'Yes', Q4: 'Yes' }}
      ],
      sensitiveAttrs: [
        { name: 'sex', type: 'categorical', range: ['Men', 'Women'], protectedGroup: 'Men', nonProtectedGroup: 'Women'  },
        { name: 'age_in_years', type: 'continuous', range: 'continuous' },
        { name: 'age>25', type: 'categorical', range: ['age_over_25', 'age_less_25'], protectedGroup: 'age_less_25', nonProtectedGroup: 'age_over_25' },
        { name: 'age>35', type: 'categorical', range: ['age_over_35', 'age_less_35'], protectedGroup: 'age_less_35', nonProtectedGroup: 'age_over_35' }
      ],
      topk: 40,
      n: 60,
      selectedDataset: [],  // A subset of the dataset that include features, target, and idx
      inputCoords: [],
      weights: {},
      mouseoveredInstance: 1, // Index of a ranking selected among rankings in 'rankings'
      selectedRankingInterval: {
        from: 0,
        to: 60
      },
      rankingInstance: {
        rankingId: 1,
        sensitiveAttr: { 
          name: 'sex', 
          type: 'categorical', 
          range: ['Male', 'Famale'],
          protectedGroup: 'Female',
          nonProtectedGroup: 'Male' 
        },
        features: [
          { name: 'foreign_worker', type: 'categorical', range: [0,1], value: ['No', 'Yes'] },
          { name: 'credit_amount', type: 'continuous', range: []},
          { name: 'age_in_years', type: 'continuous', range: []},
          { name: 'marriage', type: 'categorical', range: [0,1,2,3]},
          { name: 'job', type: 'categorical', range: [0,1,2,3]},
          { name: 'credit_history', type: 'categorical', range: [0,1,2,3,4]},
          { name: 'account_check_status', type: 'categorical', range: [0,1,2,3]},
          { name: 'sex', type: 'categorical', range: [0,1]},
          { name: 'present_employment_since', type: 'categorical', range: [0,1,2,3,4]}
        ],
        target: { name: 'credit_risk', type: 'categorical', range: [0,1], value: ['No', 'Yes'] },
        method: { name: 'Logistic Regression' },
        sumDistortion: 0,
        instances: [],
        stat: {
          inputSpaceDist: 0,
          utility: 0, // ndcg
          precisionK: 0,
          goodnessOfFairness: 0,
          rNNSum: 0,
          rNNSumNonProtectedGroup: 0,
          rNNSumProtectedGroup: 0,
          groupSkew: 0,
          GFDCG: 0, // Global GF measure
          rND: 0, 
          sp: 0,
          cp: 0,
          tp: 0,
          fp: 0
        },
        statForPerturbation: {
          utility: 0,
          precisionK: 0,
          goodnessOfFairness: 0,
          rNNSum: 0,
          rNNSumNonProtectedGroup: 0,
          rNNSumProtectedGroup: 0,
          groupSkew: 0,
          GFDCG: 0,
          rND: 0,
          sp: 0,
          cp: 0,
          tp: 0,
          fp: 0
        },
        isForPerturbation: false,  // False in python
        currentTopk: 30,
        shouldRunModel: true,
        isReranking: false
      },
      output: [],
      selectedInstances: [],
      pairwiseInputDistances: [],
      permutationInputDistances: [],
      pairwiseDiffs: [],
      permutationDiffs: [],
      permutationDiffsFlattened: [],
      selectedPermutationDiffsFlattend: [],
      rankings: []
    };

    this.handleModelRunning = this.handleModelRunning.bind(this);
    this.handleSelectedInterval = this.handleSelectedInterval.bind(this);
    this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
    this.handleSelectedInstance = this.handleSelectedInstance.bind(this);
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
    this.handleSensitiveAttr = this.handleSensitiveAttr.bind(this);
    this.handleFilterRunning = this.handleFilterRunning.bind(this);
  }

  componentWillMount() {
  }

  componentDidMount() {
    const _self = this;
    const { dataset, rankingInstance } = this.state,
          { method, isForPerturbation } = rankingInstance;

    this.getFetches(rankingInstance, method)
    .then((responses) => {
      const { methods, features, 
              topk, n, selectedRankingInterval, mouseoveredInstance, rankings,
              permutationDiffsFlattened } = this.state;
      const updatedRankingInstance = responses[2],
            inputSpaceDist = responses[4],
            { instances } = updatedRankingInstance,
            { from, to } = selectedRankingInterval;

      let updatedInstances = [],
          inputs = [];

      this.calculatePairwiseDiffs();
      this.calculatePermutationDiffs();
      this.permutationDiffsFlattened = _.flatten(this.permutationDiffs);
      const { rNNSum, rNNSumNonProtectedGroup, rNNSumProtectedGroup } = this.calculateRSquared(instances, this.pairwiseDiffs);
      this.calculatePredictionIntervalandOutliers(this.pairwiseDiffs);
      updatedInstances = this.calculateSumDistortion(instances, this.permutationDiffsFlattened);
      updatedInstances = this.calculateOutlierInstances(updatedInstances);
      this.calculateNDM(this.permutationDiffs);
      const groupSkew = this.calculateGroupSkew(this.pairwiseDiffs);
      const { utility, precisionK, GFDCG, rND, sp, cp } = this.calculateOutputMeasures(topk);
      this.calculateCorrBtnSensitiveAndAllFeatures();

      let sortedInstances = _.sortBy(updatedInstances, 'ranking'),
          selectedRanking = rankings[rankingInstance.rankingId - 1];

      this.selectedInstances = sortedInstances.slice(from, to);

      // Subsetting permutation distortions for selected interval
      this.selectedPermutationDiffsFlattend = _.filter(this.permutationDiffsFlattened, (d) => 
              (d.ranking1 >= from) && (d.ranking1 <= to) &&
              (d.ranking2 >= from) && (d.ranking2 <= to)
            );

      this.setState((prevState) => {
        const currentRankingInstance = {
          ...prevState.rankingInstance,
            instances: sortedInstances,
            stat: {
              ...prevState.rankingInstance.stat,
              inputSpaceDist: inputSpaceDist,
              groupSkew: groupSkew,
              goodnessOfFairness: this.rSquared,
              rNNSum: rNNSum,
              rNNSumNonProtectedGroup: rNNSumNonProtectedGroup,
              rNNSumProtectedGroup: rNNSumProtectedGroup,
              utility: utility,
              precisionK: precisionK,
              GFDCG: GFDCG,
              rND: rND,
              sp: sp,
              cp: cp
            },
            isForPerturbation: false
        }

        return {
          shouldRunModel: true,
          selectedInstances: this.selectedInstances,
          pairwiseDiffs: this.pairwiseDiffs,
          permutationDiffs: this.permutationDiffs,
          permutationDiffsFlattened: this.permutationDiffsFlattened,
          selectedPermutationDiffsFlattend: this.selectedPermutationDiffsFlattend,
          rankingInstance: currentRankingInstance,
          rankings: [ currentRankingInstance ]
        }
      });

      inputs = _.map(this.pairwiseDiffs, (d) => {
          return {
            idx1: d.idx1,
            idx2: d.idx2,
            X: d.scaledDiffInput,
            y: d.distortion,
            yHat: 0
          }
      });
    });
  }

  getDataset() {
    return fetch('/dataset/file')
          .then( (response) => {
              return response.json() 
          })   
          .then( (file) => {
            const dataset = _.values(JSON.parse(file));

            this.setState({
              dataset: dataset,
              n: dataset.length
            });
          });
  }
  
  getFeatures() {
    const { features, rankingInstance } = this.state,
          initialFeatures = rankingInstance.features.map((d) => d.name);

    return fetch('/dataset/extractFeatures')
        .then( (response) => {
          return response.json() 
        })
        .then( (response) => {
          const features = _.values(JSON.parse(response));
          const initialFeatureObjects = [];
          
          initialFeatures.forEach((initialFeature) => {
            initialFeatureObjects.push(features.filter((d) => d.name === initialFeature)[0]);
          });

          this.setState(prevState => ({
            features: features,
            rankingInstance: {
              ...prevState.rankingInstance,
              features: initialFeatureObjects
            }
          }));
        });
  }
  
  // Response: All features, and values multiplied by weight
  runRankSVM(rankingInstance) {
    return fetch('/dataset/runRankSVM/', {
            method: 'post',
            body: JSON.stringify(rankingInstance)
          })
          .then( (response) => {
            return response.json();
          })   
          .then( (response) => {
              const rankingInstance = JSON.parse(response);
              
              this.setState(prevState => ({
                rankingInstance: rankingInstance
              }));

              return rankingInstance;
            });
  }

  runLR(rankingInstance) {
    return fetch('/dataset/runLR/', {
            method: 'post',
            body: JSON.stringify(rankingInstance)
          })
          .then( (response) => {
            return response.json();
          })   
          .then( (response) => {
              const rankingInstance = JSON.parse(response);
              
              this.setState(prevState => ({
                rankingInstance: rankingInstance
              }));

              return rankingInstance;
            });
  }

  runSVM(rankingInstance) {
    return fetch('/dataset/runSVM/', {
            method: 'post',
            body: JSON.stringify(rankingInstance)
          })
          .then( (response) => {
            return response.json();
          })   
          .then( (response) => {
              const rankingInstance = JSON.parse(response);
              
              this.setState(prevState => ({
                rankingInstance: rankingInstance
              }));

              return rankingInstance;
            });
  }

  runACF(rankingInstance) {
    return fetch('/dataset/runACF/', {
            method: 'post',
            body: JSON.stringify(rankingInstance)
          })
          .then( (response) => {
            return response.json();
          })   
          .then( (response) => {
              const rankingInstance = JSON.parse(response);
              
              this.setState(prevState => ({
                rankingInstance: rankingInstance
              }));

              return rankingInstance;
            });
  }
  
  calculatePairwiseInputDistance(rankingInstance) {
    return fetch('/dataset/calculatePairwiseInputDistance/', {
            method: 'post',
            body: JSON.stringify(rankingInstance)
          })
          .then( (response) => {
            return response.json();
          })   
          .then( (response) => {
            const json_response = JSON.parse(response),
                  pairwiseInputDistances = json_response.pairwiseDistances,
                  permutationInputDistances = json_response.permutationDistances;
            
            this.setState({
              pairwiseInputDistances: pairwiseInputDistances,
              permutationInputDistances: permutationInputDistances
            });
          });
  }
  
  // Response: Dim coordinates
  runTSNE(rankingInstance) {
    return fetch('/dataset/runTSNE/', {
          method: 'post',
          body: JSON.stringify(rankingInstance)
        })
        .then( (response) => {
          return response.json();
        })   
        .then( (responseOutput) => {
          const { inputSpaceDist, dimReductions } = JSON.parse(responseOutput);
          
          this.setState(prevState => ({
            inputCoords: _.values(JSON.parse(dimReductions))
            // rankingInstance: {
            //   ...prevState.rankingInstance,
            //   stat: {
            //     ...prevState.rankingInstance.stat,
            //     inputSpaceDist: Math.round(inputSpaceDist * 100) / 100
            //   }
            // }
          }));

          return inputSpaceDist;
        });
  }
  
  getFetches(rankingInstance, method) {
    if (method.name === 'RankSVM') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runRankSVM(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runTSNE(rankingInstance)]);
    } else if (method.name === 'SVM') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runSVM(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runTSNE(rankingInstance)]);
    } else if (method.name === 'Logistic Regression') {
      return Promise.all([this.getFeatures(),
        this.getDataset(), this.runLR(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runTSNE(rankingInstance)]);
    } else if (method.name === 'Additive Counterfactual Fairness') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runACF(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runTSNE(rankingInstance)]);
    }
  }

  handleSelectedInstance(instance) {
    this.setState({
      selectedInstance: instance
    });
  }

  handleRankingInstanceOptions(optionObj) {  // optionObj e.g., { sensitiveAttr: 'sex' }
    const { features, methods, sensitiveAttrs } = this.state;
    
    this.setState(prevState => {
      const stateProperty = Object.keys(optionObj)[0];

      if (stateProperty === 'reranking') {
        return {
          rankingInstance: {
            ...prevState.rankingInstance,
            shouldRunModel: false,
            isReranking: true
          }
        }
      }
      else if (stateProperty === 'method') {
        
        const methodName = Object.values(optionObj)[0],
              methodObj = methods.filter((d) => d.name === methodName)[0];

        return {
          rankingInstance: {
            ...prevState.rankingInstance,
            shouldRunModel: false,
            method: {
              ...methodObj
            }
          }};
      }

      else if (stateProperty === 'features') {
        const featureNames = Object.values(optionObj)[0],
              featureObjs = featureNames.map((d) => 
                features.filter((e) => d === e.name)[0]
              ); // Go through all features and select the feature object

        return {
          rankingInstance: {
            ...prevState.rankingInstance,
            shouldRunModel: false,
            features: featureObjs
          }
        };
      }

      else if (stateProperty === 'sensitiveAttr'){
        const sensitiveAttr = Object.values(optionObj)[0],
              featureObj = sensitiveAttrs.filter((d) => d.name === sensitiveAttr)[0]; // Go through all features and Select the feature object

        return {
          rankingInstance: {
            ...prevState.rankingInstance,
            shouldRunModel: false,
            sensitiveAttr: {
              ...featureObj
            }
          }
        };
      }
      
      else {
        const featureName = Object.values(optionObj)[0],
              featureObj = features.filter((d) => d.name === featureName)[0]; // Go through all features and Select the feature object

        return {
          rankingInstance: {
            ...prevState.rankingInstance,
            shouldRunModel: false,
            [stateProperty]: {
              ...featureObj
            }
          }
        };
      }
     });
  }

  handleModelRunning(){  // this.state.rankingInstance from Generator
    this.setState({ isModelRunning: true });

    const { rankingInstance } = this.state,
          { method } = rankingInstance;

    const rankingInstanceWithUpdatedId = {
      ...rankingInstance,
      rankingId: rankingInstance.rankingId + 1
    }

    // data file loading here
    this.getFetches(rankingInstanceWithUpdatedId, method)
    .then((responses) => {
      const { rankings, topk } = this.state,
          updatedRankingInstance = responses[2],
          inputSpaceDist = responses[4],
          { instances, isForPerturbation } = updatedRankingInstance;

      let updatedInstances = [],
          inputs = [];

      this.calculatePairwiseDiffs();
      this.calculatePermutationDiffs();
      this.permutationDiffsFlattened = _.flatten(this.permutationDiffs);
      const { rNNSum, rNNSumNonProtectedGroup, rNNSumProtectedGroup } = this.calculateRSquared(instances, this.pairwiseDiffs);
      this.calculatePredictionIntervalandOutliers(this.pairwiseDiffs);
      updatedInstances = this.calculateSumDistortion(instances, this.permutationDiffsFlattened);
      updatedInstances = this.calculateOutlierInstances(updatedInstances);
      this.calculateNDM(this.permutationDiffs);
      const groupSkew = this.calculateGroupSkew(this.pairwiseDiffs);
      const { utility, precisionK, GFDCG, rND, sp, cp } = this.calculateOutputMeasures(topk);

      this.setState((prevState) => {
        const currentRankingInstance = {
            ...updatedRankingInstance,
            shouldRunModel: true,
            instances: updatedInstances,
            stat: {
              ...updatedRankingInstance.stat,
              inputSpaceDist: inputSpaceDist,
              groupSkew: groupSkew,
              goodnessOfFairness: this.rSquared,
              rNNSum: rNNSum,
              rNNSumNonProtectedGroup: rNNSumNonProtectedGroup,
              rNNSumProtectedGroup: rNNSumProtectedGroup,
              utility: utility,
              precisionK: precisionK,
              GFDCG: GFDCG,
              rND: rND,
              sp: sp,
              cp: cp
            },
            isForPerturbation: false
          }

        return {
          selectedInstances: this.selectedInstances,
          pairwiseDiffs: this.pairwiseDiffs,
          permutationDiffs: this.permutationDiffs,
          permutationDiffsFlattened: this.permutationDiffsFlattened,
          selectedPermutationDiffsFlattend: this.selectedPermutationDiffsFlattend,
          rankingInstance: currentRankingInstance,
          rankings: [...prevState.rankings, currentRankingInstance ],
          shouldRunModel: true,
          isModelRunning: false
        }
      });
    });
  }

  handleFilterRunning(currentTopk) {
    const { rankingInstance, permutationDiffsFlattened, selectedRankingInterval } = this.state,
          { instances } = rankingInstance,
          { from, to } = selectedRankingInterval;
        
    const selectedPermutationDiffsFlattend = _.filter(permutationDiffsFlattened, (d) => 
            (d.ranking1 >= from) && (d.ranking1 <= to) &&
            (d.ranking2 >= from) && (d.ranking2 <= to)
          );

    this.setState(prevState => ({
      selectedPermutationDiffsFlattend: selectedPermutationDiffsFlattend,
      selectedInstances: instances.slice(from, to),
      rankingInstance: {
        ...prevState.rankingInstance,
        currentTopk: currentTopk
      }
    }));
  }

  handleSelectedInterval(intervalTo) {
    this.setState({
      selectedRankingInterval: { from: 0, to: intervalTo }
    });
  }

  handleSelectedTopk(topk) {
    this.calculateOutputMeasures(topk);

    this.setState({
      topk: topk
    });
  }

  handleMouseoverInstance(idx) {
    this.setState({
      selectedInstance: idx
    });
  }

  handleSensitiveAttr(groupsObj) {
    this.setState(prevState => ({
      rankingInstance: {
        ...prevState.rankingInstance,
        shouldRunModel: false,
        sensitiveAttr: {
          ...prevState.rankingInstance.sensitiveAttr,
          protectedGroup: groupsObj.protectedGroup,
          nonProtectedGroup: groupsObj.nonProtectedGroup
        }
      }
    }));
  }

  combineInputsAndOutputs() {
    const _self = this;

    const { inputCoords, selectedRankingInterval, rankingInstance } = this.state,
          { instances } = rankingInstance,
          idx = _.map(instances, (d) => d.idx);

    // Union 
    const combinedData = _.map(idx, (currentIdx) => {
        let inputObj = _.find(inputCoords, {'idx': currentIdx}),
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

  setScalesFromDataPairs(pairwiseInputDistances, pairs){
    const _self = this;

    _self.inputScale = d3.scaleLinear()
        .domain(d3.extent(pairwiseInputDistances, (d) => d.input_dist))
        .range([0, 1]);
    _self.outputScale = d3.scaleLinear()
        .domain(d3.extent(pairs, (d) => 
            Math.abs(d[0].instance.ranking - d[1].instance.ranking))
        )
        .range([0, 1]);
  }

  calculateCorrBtnSensitiveAndAllFeatures() {
    const _self = this;
    const { dataset, rankingInstance } = this.state,
          { sensitiveAttr } = rankingInstance,
          wholeFeatures = Object.keys(dataset[0]).filter((d) => d !== 'idx' || d !== sensitiveAttr.name),
          sensitiveAttrName = sensitiveAttr.name;

    const groupInstances1 = dataset.filter((d) => d[sensitiveAttrName] === 0),
          groupInstances2 = dataset.filter((d) => d[sensitiveAttrName] === 1);

    const corrTestRequest = {
      wholeFeatures: wholeFeatures,
      groupInstances1: groupInstances1,
      groupInstances2: groupInstances2
    }

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
        corrBtnSensitiveAndAllFeatures: corrTestResult
      });
    });
  }

  // Calculate distortions of combinatorial pairs (For pairwise distortion plot)
  calculatePairwiseDiffs() {
    const _self = this;
    const { pairwiseInputDistances } = this.state,
          instances = _self.combineInputsAndOutputs(),
          pairs = pairwise(_.sortBy(instances, 'idx'));

    _self.setScalesFromDataPairs(pairwiseInputDistances, pairs);

    // Get difference between input space(from dataPairwiseInputDistances) and output space(from dataPairs.output.ranking)
    let pairwiseDiffs = [];
    for(let i=0; i<pairs.length-1; i++){
      let diffInput = pairwiseInputDistances[i].input_dist,
          diffOutput = Math.abs(pairs[i][0].instance.ranking - pairs[i][1].instance.ranking);
      
      const pair = (pairs[i][0].group === 0) && (pairs[i][1].group === 0) ? 1        
                 : (pairs[i][0].group === 1) && (pairs[i][1].group === 1) ? 2
                 : (pairs[i][0].group !== pairs[i][1].group) ? 3
                 : 0;
        
      pairwiseDiffs.push({
        idx1: pairs[i][0].idx,
        idx2: pairs[i][1].idx,
        ranking1: pairs[i][0].instance.ranking,
        ranking2: pairs[i][1].instance.ranking,
        x1: pairs[i][0].instance,
        x2: pairs[i][1].instance,
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

    const diffInputs = pairwiseDiffs.map((d) => d.scaledDiffInput);
    const mean = diffInputs.reduce((acc, curr) => acc + curr) / diffInputs.length,
          variance = diffInputs
            .map((scaledDiffInput) => Math.pow(scaledDiffInput - mean, 2))
            .reduce((acc, curr) => acc + curr) / diffInputs.length;

    this.pairwiseDiffs = pairwiseDiffs;
  }

  // Calculate distortions of permutational pairs (For matrix view)
  calculatePermutationDiffs() {
    const _self = this;

    const instances = _.sortBy(_self.combineInputsAndOutputs(), 'idx'),
          permutationInputDistances = _self.state.permutationInputDistances;

    let permutationDiffs = [], 
        input_idx = 0;

    _.forEach(instances, (obj1) => {
        let row = [];
        _.forEach(instances, (obj2) => {
          const diffInput = permutationInputDistances[input_idx].input_dist,
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
            ranking1: obj1.instance.ranking,
            ranking2: obj2.instance.ranking,
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
        permutationDiffs.push(row);
    });

    this.permutationDiffs = permutationDiffs;
  }

  calculateSumDistortion(instances, permutationDiffs) {
    const updatedInstances = _.map(instances, (d, i) => {
                d.sumDistortion = permutationDiffs
                    .filter((e) => e.idx1 === instances[i].idx)
                    .map((e) => e.absDistortion)
                    .reduce((sum, e) => sum + e);

                return d;
              });

    return updatedInstances;
  }

  calculateGroupSkew(pairwiseDiffs) {
    const btnPairs = pairwiseDiffs
            .filter((d) => d.pair === 3)
            .map((d) => d.absDistortion),
          btnPairsSum = btnPairs.reduce((sum, curr) => sum + curr);
    const wtnPairs = pairwiseDiffs
            .filter((d) => d.pair === 1 || d.pair === 2)
            .map((d) => d.absDistortion),
          wtnPairsSum = wtnPairs.reduce((sum, curr) => sum + curr);

    const wtnPairsForGroup1 = pairwiseDiffs
          .filter((d) => d.pair === 1)
          .map((d) => d.absDistortion),
          wtnPairsSumForGroup1 = wtnPairs.reduce((sum, curr) => sum + curr);

    const wtnPairsForGroup2 = pairwiseDiffs
          .filter((d) => d.pair === 2)
          .map((d) => d.absDistortion),
          wtnPairsSumForGroup2 = wtnPairs.reduce((sum, curr) => sum + curr);

    const groupSkew = (btnPairsSum / btnPairs.length) / 
                      (wtnPairsSum / wtnPairs.length);
    
    return Math.round(groupSkew * 1000) / 1000;
  }

  calculateOutputMeasures(topk) {
    const { rankingInstance, n } = this.state,
          { instances, sensitiveAttr } = rankingInstance,
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
          nNonProtectedGroupInTopk = nonProtectedGroupInTopk.length,
          nNonProtectedGroupInWhole = nonProtectedGroupInWhole.length,
          Z = (1 / (Math.log(topk) / Math.log(2))) * Math.abs( (Math.min(nProtectedGroupInWhole, topk) / topk) - (nProtectedGroupInWhole / n) ),
          rND = 1 - (1/Z) * (1 / (Math.log(topk) / Math.log(2))) * Math.abs( (nProtectedGroupInTopk / topk) - (nProtectedGroupInWhole / n) );

    const statisticalParity = (nProtectedGroupInTopk / nProtectedGroupInWhole) / 
                              (nNonProtectedGroupInTopk / nNonProtectedGroupInWhole);
    const conditionalParity = (group2.filter((d) => d.ranking <= topk && d.target === 0).length / group2.length) / 
                              (group1.filter((d) => d.ranking <= topk && d.target === 0).length / group1.length);

    // For utility = nDCG
    const topkInstances = instances.filter((d) => d.ranking <= topk);
    const precisionK = topkInstances.filter((d) => d.target === 0).length / topkInstances.length;

    const DCGForProtectedGroup = protectedGroupInTopk.filter((d) => d.target === 0)
                                                      .map((d) => (n - d.ranking) / n)
                                                      .reduce((acc, curr) => acc + curr) / nProtectedGroupInWhole;
    const DCGForNonProtectedGroup = nonProtectedGroupInTopk.filter((d) => d.target === 0)
                                                      .map((d) => (n - d.ranking) / n) 
                                                      .reduce((acc, curr) => acc + curr) / nNonProtectedGroupInWhole;
    const GFDCG =  DCGForProtectedGroup / DCGForNonProtectedGroup;
    
    const DCG = topkInstances.map((d, i) => { // sorted by ranking
              const relevance = d.target - 1;
              const cumulativeDiscount = (topk - d.ranking) / topk;

              return relevance * cumulativeDiscount;
            }).reduce((acc, curr) => acc + curr);

    const IDCG = _.sortBy(topkInstances, 'target').reverse().map((d, i) => {
              const relevance = d.target - 1;
              const cumulativeDiscount = (topk - d.ranking) / topk;

              return relevance * cumulativeDiscount;
            }).reduce((acc, curr) => acc + curr);

    const nDCG = DCG / IDCG;

    return {
      utility: Math.round(nDCG * 10000) / 10000,
      precisionK: Math.round(precisionK * 100) / 100,
      GFDCG: Math.round(GFDCG * 100) / 100,
      rND: Math.round(rND * 100) / 100,
      sp: Math.round(statisticalParity * 100) / 100, 
      cp: Math.round(conditionalParity * 100) / 100
    }
  }

  calculateOutlierInstances(instances) {
    const sumDistortions = instances.map((d) => d.sumDistortion);
    const mean = sumDistortions.reduce((acc, curr) => acc + curr) / sumDistortions.length,
          variance = sumDistortions
            .map((sumDistortion) => Math.pow(sumDistortion - mean, 2))
            .reduce((acc, curr) => acc + curr) / sumDistortions.length,
          std = Math.sqrt(variance);

    return instances.map((d) => {
      const threshold = mean + 1.645*std;
      if (d.sumDistortion >= threshold) {
        d.isOutlier = true;
      } else {
        d.isOutlier = false;
      }

      return d;
    });
  }

  calculatePredictionIntervalandOutliers(pairwiseDiffs) {
    const distortions = _.map(pairwiseDiffs, (d) => {
          const distortion = d.distortion,
                upperLimit = 0.90,  
                lowerLimit = -0.90; // nt

          if((distortion > upperLimit) || (distortion < lowerLimit)) {
            d.isOutlier = true;
          }
        });
  }

  calculateRSquared(instances, pairwiseDiffs) {
    let SSE_arr = [], SST_arr = [],
        SSE, SST, rSquared,
        n = pairwiseDiffs.length,
        meanY = _.sum(_.map(pairwiseDiffs, (d) => d.scaledDiffOutput)) / n;
    
    _.each(pairwiseDiffs, (d) => {
      SSE_arr.push(Math.pow(d.scaledDiffOutput - d.scaledDiffInput, 2));
      SST_arr.push(Math.pow(meanY - d.scaledDiffOutput, 2));
    });

    SSE = _.sum(SSE_arr);
    SST = _.sum(SST_arr);
    
    this.rSquared = Math.round((1 - (SSE / SST)) * 100) / 100;

    const nNeighbors = 4;
    let rNNs = [],
        rNNsNonProtectedGroup = [],
        rNNsProtectedGroup = [];

    instances.forEach((instance) => {
      let rNN;

      const NNPairs = pairwiseDiffs.filter((d) => {
        return (d.idx1 == instance.idx) || (d.idx2 == instance.idx);
      }).sort((a, b) => d3.ascending(a.scaledDiffInput, b.scaledDiffInput)).slice(0, nNeighbors);

      const yAbsDiffsForNNs = NNPairs.map((d) => Math.abs(d.ranking1 - d.ranking2) / Math.max(d.ranking1, d.ranking2)),
            sumAbsDiffsForNNs = yAbsDiffsForNNs.reduce((acc, curr) => acc + curr);

      const yDiffsForNNs = NNPairs.map((d) => (d.ranking1 - d.ranking2) / Math.max(d.ranking1, d.ranking2)),
            sumDiffsForNNs = yDiffsForNNs.reduce((acc, curr) => acc + curr);

      rNN = 1 - (sumAbsDiffsForNNs / nNeighbors);
      
      if (instance.group === 0) {
        rNNsNonProtectedGroup.push(rNN);
      } else {
        rNNsProtectedGroup.push(rNN);
      }

      rNNs.push(rNN);
    });

    const rNNSum = rNNs.reduce((acc, curr) => acc + curr) / rNNs.length,
          rNNSumNonProtectedGroup = rNNsNonProtectedGroup.reduce((acc, curr) => acc + curr) / rNNs.length,
          rNNSumProtectedGroup = rNNsProtectedGroup.reduce((acc, curr) => acc + curr) / rNNs.length;

    console.log('rNNSumGroup: ', rNNSumNonProtectedGroup, rNNSumProtectedGroup);

    return { 
      rNNSum: rNNSum,
      rNNSumNonProtectedGroup: rNNSumNonProtectedGroup,
      rNNSumProtectedGroup: rNNSumProtectedGroup
     };
  }

  calculateNDM(selectedPermutationDiffs) {  // Noise Dissimilarity Measure for feature matrix
    // Generate a random permutation
    let originalMat = _.map(selectedPermutationDiffs, (arr) => _.map(arr, (d) => d.distortion)),
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

  render() {
    if ((!this.state.rankingInstance || this.state.rankingInstance.length === 0) || 
        (!this.state.inputCoords || this.state.inputCoords.length === 0) ||
        (!this.state.pairwiseInputDistances || this.state.pairwiseInputDistances.length === 0) ||
        (!this.state.pairwiseDiffs || this.state.pairwiseDiffs.length === 0) ||
        (!this.state.permutationDiffs || this.state.permutationDiffs.length === 0) ||
        (!this.state.rankings || this.state.rankings.length === 0) || 
        (Object.keys(this.state.corrBtnSensitiveAndAllFeatures).length === 0) ||
        (!this.state.topk)
       ) {
      return (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingLogo}>FAIRSIGHT</div>
          <div className={styles.loadingMessage}>
            Loading... &nbsp;
            <Button shape="circle" size='small' loading />
          </div>
        </div>)
    }

    console.log('rerank:', this.state.rankingInstance.rerank)

    // For the Ranking Inspector, only send down the selected ranking data
    const { rankingInstance, dataset, methods, features, 
            topk, n, selectedRankingInterval, mouseoveredInstance, rankings,
            selectedInstances, permutationDiffsFlattened, selectedPermutationDiffsFlattend } = this.state,
          { instances } = rankingInstance,
          { from, to } = selectedRankingInterval;

    return (
      <div className={styles.App}>
        <div className={styles.marginDiv}></div>
        <Menubar 
            topk={topk}
            data={this.state.rankingInstance}
            onSelectSensitiveAttr={this.handleSelectSensitiveAttr} />
        <Generator 
            className={styles.Generator}
            dataset={this.state.dataset}
            methods={this.state.methods}
            features={this.state.features}
            numericalFeatures={this.state.numericalFeatures}
            ordinalFeatures={this.state.ordinalFeatures}
            corrBtnSensitiveAndAllFeatures={this.state.corrBtnSensitiveAndAllFeatures}
            rankingInstance={this.state.rankingInstance}
            n={this.state.n}
            onSelectRankingInstanceOptions={this.handleRankingInstanceOptions}
            onRunningModel={this.handleModelRunning}
            onSelectProtectedGroup={this.handleSensitiveAttr} />
        <RankingView 
            n={this.state.n}
            isModelRunning={this.state.isModelRunning}
            data={this.state.rankingInstance}
            pairwiseDiffs={this.pairwiseDiffs}
            onRunningFilter={this.handleFilterRunning}
            onSelectedInterval={this.handleSelectedInterval}
            onSelectedTopk={this.handleSelectedTopk}  />
        <div className={styles.RankingInspector}>
          <RankingInspectorView 
              isModelRunning={this.state.isModelRunning}
              data={this.state.rankingInstance}
              topk={this.state.topk}
              n={this.state.n}
              selectedInstance={this.state.mouseoveredInstance}
              selectedRankingInterval={this.state.selectedRankingInterval}
              pairwiseInputDistances={this.state.pairwiseInputDistances}
              permutationInputDistances={this.state.permutationInputDistances}
              pairwiseDiffs={this.pairwiseDiffs}
              permutationDiffs={this.permutationDiffs}
              permutationDiffsFlattened={this.permutationDiffsFlattened}
              inputCoords={this.state.inputCoords}
              onCalculateNDM={this.calculateNDM}
              onFilterRunning={this.handleFilterRunning} 
          />
        </div>
        <RankingsListView rankings={this.state.rankings} />
        <Footer />
        
      </div>
    );
  }
}

export default App;
