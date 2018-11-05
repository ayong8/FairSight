import React, { Component } from "react";
import { connect } from 'react-redux';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from "./styles.scss";
import index from '../../index.css';
import 'antd/dist/antd.css';

import Menubar from 'components/Menubar';
import Generator from 'components/Generator';
import RankingsListView from 'components/RankingsListView';
import InputSpaceView from 'components/InputSpaceView';
import IndividualInspectionView from 'components/IndividualInspectionView';
import RankingView from 'components/RankingView';
import RankingInspectorView from 'components/RankingInspectorView';
import TopkRankingView from 'components/TopkRankingView';
import GroupFairnessView from 'components/GroupFairnessView';
import UtilityView from 'components/UtilityView';
import Footer from "components/Footer";

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
      dataset: [],
      features: [],
      numericalFeatures: ['duration_in_month', 'credit_amount',	'installment_rate_in_percentage_of_disposable_income',	
                    'present_residence_since',	'age_in_years', 'number_of_existing_credits_at_this_bank',	
                    'number_of_people_being_liable_to_provide_maintenance_for',	'status_of_existing_checking_account',	
                    'savings_account/bonds', 'present_employment_since', 'job',	'telephone'],
      methods: [
        {name: 'RankSVM', spec: { Q1: 'A', Q2: '', Q3: '', Q4: '' }},
        {name: 'SVM', spec: { Q1: 'A', Q2: '', Q3: '', Q4: '' }},
        {name: 'Logistic Regression', spec: { Q1: 'A', Q2: '', Q3: '', Q4: '' }},
        {name: 'Additive Counterfactual Fairness', spec: { Q1: 'F', Q2: 'B', Q3: 'Yes', Q4: 'No' }}
      ],
      sensitiveAttrs: [
        { name: 'sex', type: 'categorical', range: ['Men', 'Women'], protectedGroup: 'Men', nonProtectedGroup: 'Women'  },
        { name: 'age_in_years', type: 'continuous', range: 'continuous' },
        { name: 'age>25', type: 'categorical', range: ['age_over_25', 'age_less_25'], protectedGroup: 'age_less_25', nonProtectedGroup: 'age_over_25' },
        { name: 'age>35', type: 'categorical', range: ['age_over_35', 'age_less_35'], protectedGroup: 'age_less_35', nonProtectedGroup: 'age_over_35' }
      ],
      topk: 20,
      n: 40,
      selectedDataset: [],  // A subset of the dataset that include features, target, and idx
      inputCoords: [],
      weights: {},
      mouseoveredInstance: 1, // Index of a ranking selected among rankings in 'rankings'
      selectedRankingInterval: {
        from: 0,
        to: 50
      },
      rankingInstance: {
        rankingId: 1,
        sensitiveAttr: { 
          name: 'sex', 
          type: 'categorical', 
          range: ['Male', 'Female'],
          protectedGroup: 'Male',
          nonProtectedGroup: 'Female' 
        },
        features: [
          { name: 'foreign_worker', type: 'categorical', range: [0,1], value: ['No', 'Yes'] },
          { name: 'credit_amount', type: 'continuous', range: 'continuous' },
          { name: 'installment_rate_in_percentage_of_disposable_income', type: 'continuous', range: 'continuous' },
          { name: 'age_in_years', type: 'continuous', range: 'continuous' }
        ],
        target: { name: 'credit_risk', type: 'categorical', range: [0, 1], value: ['No', 'Yes'] },
        method: { name: 'Logistic Regression' },
        sumDistortion: 0,
        instances: [],
        stat: {
          accuracy: 0,
          goodnessOfFairness: 0,
          groupSkew: 0,
          sp: 0,
          cp: 0,
          tp: 0,
          fp: 0,
          ndcg: 0
        },
        isForPerturbation: false  // False in python
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
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
    this.handleSensitiveAttr = this.handleSensitiveAttr.bind(this);
    this.handleFilterRunning = this.handleFilterRunning.bind(this);
  }

  componentWillMount() {
  }

  componentDidMount() {
    const _self = this;
    const { dataset, rankingInstance } = this.state,
          { method } = rankingInstance;

    // Store feature information
    dataset

    this.getFetches(rankingInstance, method)
    .then((responses) => {
      const { rankingInstance, dataset, methods, features, 
              topk, n, selectedRankingInterval, mouseoveredInstance, rankings,
              permutationDiffsFlattened } = this.state,
            { instances } = rankingInstance,
            { from, to } = selectedRankingInterval;

      let updatedInstances = [],
          inputs = [];

      this.calculatePairwiseDiffs();
      this.calculatePermutationDiffs();
      this.permutationDiffsFlattened = _.flatten(this.permutationDiffs);
      this.calculateRSquared(this.pairwiseDiffs);
      this.calculatePredictionIntervalandOutliers(this.pairwiseDiffs);
      updatedInstances = this.calculateSumDistortion(instances, this.permutationDiffsFlattened);
      updatedInstances = this.calculateOutlierInstances(updatedInstances);
      this.calculateNDM(this.permutationDiffs);
      this.calculateGroupSkew(this.pairwiseDiffs);
      this.calculateOutputMeasures();

      console.log('isOutlier: ', instances);

      let sortedInstances = _.sortBy(updatedInstances, 'ranking'),
          selectedRanking = rankings[rankingInstance.rankingId - 1];

      this.selectedInstances = sortedInstances.slice(from, to);

      // Subsetting permutation distortions for selected interval
      this.selectedPermutationDiffsFlattend = _.filter(this.permutationDiffsFlattened, (d) => 
              (d.ranking1 >= from) && (d.ranking1 <= to) &&
              (d.ranking2 >= from) && (d.ranking2 <= to)
            );

      this.setState((prevState) => ({
        selectedInstances: this.selectedInstances,
        pairwiseDiffs: this.pairwiseDiffs,
        permutationDiffs: this.permutationDiffs,
        permutationDiffsFlattened: this.permutationDiffsFlattened,
        selectedPermutationDiffsFlattend: this.selectedPermutationDiffsFlattend,
        rankingInstance: {
          ...prevState.rankingInstance,
          instances: sortedInstances,
          stat: {
            ...prevState.rankingInstance.stat,
            goodnessOfFairness: this.rSquared
          }
        },
        rankings: [...prevState.rankings, rankingInstance]
      }));

      inputs = _.map(this.pairwiseDiffs, (d) => {
          return {
            idx1: d.idx1,
            idx2: d.idx2,
            X: d.scaledDiffInput,
            y: d.distortion,
            yHat: 0
          }
      });

      return fetch('/dataset/calculateConfidenceInterval/', {
        method: 'post',
        body: JSON.stringify(inputs)
      });
    })
    .then( (response) => {
      return response.json();
    })
    .then( (response) => {
      const confIntervalPoints = JSON.parse(response);

      _self.setState({
        confIntervalPoints: confIntervalPoints
      });
      _self.setFairInstancesFromConfidenceInterval(confIntervalPoints, this.pairwiseDiffs);
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
              console.log(rankingInstance.instances.map((d) => d.idx));
              
              this.setState(prevState => ({
                rankingInstance: rankingInstance
              }));
            });
  }

  runLR(rankingInstance) {
    console.log('in runLR: ', rankingInstance.instances.map((d) => d.idx));
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
            });
  }

  runSVM(rankingInstance) {
    console.log('in runSVM: ', rankingInstance.instances.map((d) => d.idx));
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
  runMDS(rankingInstance) {
    return fetch('/dataset/runMDS/', {
          method: 'post',
          body: JSON.stringify(rankingInstance)
        })
        .then( (response) => {
          return response.json();
        })   
        .then( (responseOutput) => {
          const dimReductions = _.values(JSON.parse(responseOutput));
          
          this.setState({inputCoords: dimReductions});
        });
  }
  
  getFetches(rankingInstance, method) {
    if (method.name === 'RankSVM') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runRankSVM(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runMDS(rankingInstance)]);
    } else if (method.name === 'SVM') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runSVM(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runMDS(rankingInstance)]);
    } else if (method.name === 'Logistic Regression') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runLR(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runMDS(rankingInstance)]);
    } else if (method.name === 'Additive Counterfactual Fairness') {
      return Promise.all([this.getDataset(), 
        this.getFeatures(), this.runACF(rankingInstance), 
        this.calculatePairwiseInputDistance(rankingInstance), this.runMDS(rankingInstance)]);
    }
  }

  handleRankingInstanceOptions(optionObj) {  // optionObj e.g., { sensitiveAttr: 'sex' }
    const { features, methods, sensitiveAttrs } = this.state;
    
    this.setState(prevState => {
      const stateProperty = Object.keys(optionObj)[0];

      if (stateProperty === 'method') {
        const methodName = Object.values(optionObj)[0],
              methodObj = methods.filter((d) => d.name === methodName)[0];

        return {
          rankingInstance: {
            ...prevState.rankingInstance,
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
            [stateProperty]: {
              ...featureObj
            }
          }
        };
      }
     });
     
  }

  handleModelRunning(){
    const { rankingInstance } = this.state,
          { method } = rankingInstance;

    // data file loading here
    this.getFetches(rankingInstance, method)
    .then((responses) => {
      const { rankingInstance, rankings } = this.state,
          { instances } = rankingInstance;

      let updatedInstances = [],
          inputs = [];

      this.calculatePairwiseDiffs();
      this.calculatePermutationDiffs();
      this.permutationDiffsFlattened = _.flatten(this.permutationDiffs);
      this.calculateRSquared(this.pairwiseDiffs);
      this.calculatePredictionIntervalandOutliers(this.pairwiseDiffs);
      updatedInstances = this.calculateSumDistortion(instances, this.permutationDiffsFlattened);
      updatedInstances = this.calculateOutlierInstances(updatedInstances);
      this.calculateNDM(this.permutationDiffs);
      this.calculateGroupSkew(this.pairwiseDiffs);
      this.calculateOutputMeasures();

      this.setState((prevState) => ({
        pairwiseDiffs: this.pairwiseDiffs,
        permutationDiffs: this.permutationDiffs,
        permutationDiffsFlattened: this.permutationDiffsFlattened,
        rankingInstance: {
          ...prevState.rankingInstance,
          instances: updatedInstances,
          rankingId: prevState.rankingInstance.rankingId + 1,
          stat: {
            ...prevState.rankingInstance.stat,
            goodnessOfFairness: this.rSquared
          }
        },
        rankings: [...prevState.rankings, rankingInstance]
      }));

      inputs = _.map(this.pairwiseDiffs, (d) => {
          return {
            idx1: d.idx1,
            idx2: d.idx2,
            X: d.scaledDiffInput,
            y: d.distortion,
            yHat: 0
          }
      });

      return fetch('/dataset/calculateConfidenceInterval/', {
        method: 'post',
        body: JSON.stringify(inputs)
      });
    })
    .then( (response) => {
      return response.json();
    })
    .then( (response) => {
      const confIntervalPoints = JSON.parse(response);

      this.setState({
        confIntervalPoints: confIntervalPoints
      });
      this.setFairInstancesFromConfidenceInterval(confIntervalPoints, this.pairwiseDiffs);
    });
  }

  handleFilterRunning() {
    const { rankingInstance, permutationDiffsFlattened, selectedRankingInterval } = this.state,
          { instances } = rankingInstance,
          { from, to } = selectedRankingInterval;
        
    const selectedPermutationDiffsFlattend = _.filter(permutationDiffsFlattened, (d) => 
            (d.ranking1 >= from) && (d.ranking1 <= to) &&
            (d.ranking2 >= from) && (d.ranking2 <= to)
          );

    this.setState({
      selectedPermutationDiffsFlattend: selectedPermutationDiffsFlattend,
      selectedInstances: instances.slice(from, to)
    });
  }

  handleSelectedInterval(intervalTo) {
    this.setState({
      selectedRankingInterval: { from: 0, to: intervalTo }
    });
  }

  handleSelectedTopk(topk) {
    this.setState({
      topk: topk
    });
  }

  // handleMouseoverInstance(idx) {
  //   this.setState({
  //     selectedInstance: idx
  //   });
  // }

  handleSensitiveAttr(groupsObj) {
    this.setState(prevState => ({
      rankingInstance: {
        ...prevState.rankingInstance,
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

    const sorted = _.sortBy(pairwiseDiffs, 'diffInput');
    const diffInput = sorted.map((d) => d.diffInput),
          diffOutput = sorted.map((d) => d.diffOutput);

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

    const groupSkew = (btnPairsSum / btnPairs.length) / 
                      (wtnPairsSum / wtnPairs.length);
    this.setState((prevState) => ({
      rankingInstance: {
        ...prevState.rankingInstance,
        stat: {
          ...prevState.rankingInstance.stat,
          groupSkew: Math.round(groupSkew * 1000) / 1000
        }
      }
    }));
  }

  calculateOutputMeasures() {
    const { rankingInstance } = this.state,
          { instances } = rankingInstance;

    const group1 = instances.filter((d) => d.group === 0),
          group2 = instances.filter((d) => d.group === 1);

    const groupRanking1 = group1.map((d) => d.ranking),
          groupRanking2 = group2.map((d) => d.ranking);

    const statisticalParity = (_.sum(group2.map((d) => 1 / d.ranking)) / group2.length) / 
                              (_.sum(group1.map((d) => 1 / d.ranking)) / group1.length);
    const conditionalParity = (_.sum(group2.filter((d) => d.target === 1).map((d) => 1 / d.ranking)) / group2.length) / 
                              (_.sum(group1.filter((d) => d.target === 1).map((d) => 1 / d.ranking)) / group1.length);

    this.setState((prevState) => ({
      rankingInstance: {
        ...prevState.rankingInstance,
        stat: {
          ...prevState.rankingInstance.stat,
          sp: Math.round(statisticalParity * 100) / 100,
          cp: Math.round(conditionalParity * 100) / 100
        }
      }
    }));

    return { 
      sp: Math.round(statisticalParity * 100) / 100, 
      cp: Math.round(conditionalParity * 100) / 100
    }
  }

  setFairInstancesFromConfidenceInterval(confIntervalPoints, pairwiseDiffs) {
    const _self = this;

    const dataPairForConfInterval = _.filter(confIntervalPoints, (d) => d.isUpper === 1),
          numPairs = pairwiseDiffs.length;

          for(let i=0; i<numPairs; i++){
            pairwiseDiffs[i].isFair = dataPairForConfInterval[i].isFair;
          };

    this.pairwiseDiffs = pairwiseDiffs;
  }

  calculateOutlierInstances(instances) {
    const sumDistortions = instances.map((d) => d.sumDistortion);
    const mean = sumDistortions.reduce((acc, curr) => acc + curr) / sumDistortions.length,
          variance = sumDistortions
            .map((sumDistortion) => Math.pow(sumDistortion - mean, 2))
            .reduce((acc, curr) => acc + curr) / sumDistortions.length,
          std = Math.sqrt(variance);

    return instances.map((d) => {
      const threshold = mean + 1.95*std;
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

  calculateRSquared(pairwiseDiffs) {
    let SSR_arr = [], SST_arr = [],
        SSR, SST, rSquared,
        n = pairwiseDiffs.length,
        meanY = _.sum(_.map(pairwiseDiffs, (d) => d.scaledDiffOutput)) / n;
    
    _.each(pairwiseDiffs, (d) => {
      SSR_arr.push(Math.pow(meanY - d.scaledDiffInput, 2));
      SST_arr.push(Math.pow(meanY - d.scaledDiffOutput, 2));
    });

    SSR = _.sum(SSR_arr);
    SST = _.sum(SST_arr);

    console.log(SSR, SST)
    
    this.rSquared = Math.round((SSR / SST) * 100) / 100;
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
        (!this.state.confIntervalPoints || this.state.confIntervalPoints.length === 0) ||
        (!this.state.rankings || this.state.rankings.length === 0) || 
        (!this.state.topk)
       ) {
      return <div />
    }
    // For the Ranking Inspector, only send down the selected ranking data
    const { rankingInstance, dataset, methods, features, 
            topk, n, selectedRankingInterval, mouseoveredInstance, rankings,
            selectedInstances, permutationDiffsFlattened, selectedPermutationDiffsFlattend } = this.state,
          { instances } = rankingInstance,
          { from, to } = selectedRankingInterval;

    console.log(dataset);

    return (
      <div className={styles.App}>
        <div className={styles.marginDiv}></div>
        <Menubar 
            topk={topk}
            data={this.state.rankingInstance}
            onSelectSensitiveAttr={this.handleSelectSensitiveAttr} />
        <RankingsListView rankings={this.state.rankings} />
        <Generator 
            className={styles.Generator}
            dataset={this.state.dataset}
            methods={this.state.methods}
            features={this.state.features}
            numericalFeatures={this.state.numericalFeatures}
            rankingInstance={this.state.rankingInstance}
            n={this.state.n}
            onSelectRankingInstanceOptions={this.handleRankingInstanceOptions}
            onRunningModel={this.handleModelRunning}
            onSelectProtectedGroup={this.handleSensitiveAttr} />
        <RankingView 
            n={this.state.n}
            data={this.state.rankingInstance}
            pairwiseDiffs={this.pairwiseDiffs}
            confIntervalPoints={this.state.confIntervalPoints}
            onRunningFilter={this.handleFilterRunning}
            onSelectedInterval={this.handleSelectedInterval}
            onSelectedTopk={this.handleSelectedTopk}  />
        <div className={styles.RankingInspector}>
          <div className={styles.rankingInspectorTitle + ' ' + index.title}>Ranking Inspector</div>
          <RankingInspectorView 
              data={this.state.rankingInstance}
              topk={this.state.topk}
              n={this.state.n}
              selectedInstances={this.state.selectedInstances}
              selectedInstance={this.state.mouseoveredInstance}
              pairwiseInputDistances={this.state.pairwiseInputDistances}
              permutationInputDistances={this.state.permutationInputDistances}
              permutationDiffs={this.permutationDiffs}
              permutationDiffsFlattened={this.permutationDiffsFlattened}
              selectedPermutationDiffsFlattend={this.state.selectedPermutationDiffsFlattend}
              inputCoords={this.state.inputCoords}
              onCalculateNDM={this.calculateNDM}
              onFilterRunning={this.handleFilterRunning} />
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
