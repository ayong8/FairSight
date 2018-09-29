import React, { Component } from "react";
import { connect } from 'react-redux';
import * as d3 from 'd3';
import _ from 'lodash';
import styles from "./styles.scss";
import 'antd/dist/antd.css';

import Menubar from 'components/Menubar';
import Generator from 'components/Generator';
import RankingsListView from 'components/RankingsListView';
import InputSpaceView from 'components/InputSpaceView';
import IndividualInspectionView from 'components/IndividualInspectionView';
import RankingView from 'components/RankingView';
import IndividualFairnessView from 'components/IndividualFairnessView';
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

    this.pairwiseDiffs = [];
    this.selectedPairwiseDiffs = [];
    this.permutationDiffs = [];
    this.selectedPermutationDiffs = [];
    this.permutationDiffsFlattened = [];
    this.rSquared;

    this.state = {
      dataset: [],
      features: [],
      methods: [
        {name: 'RankSVM'},
        {name: 'SVM'},
        {name: 'Logistic Regression'}
      ],
      topk: 20,
      n: 40,
      selectedDataset: [],  // A subset of the dataset that include features, target, and idx
      inputCoords: [],
      weights: {},
      selectedInstance: 1, // Index of a ranking selected among rankings in 'rankings'
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
          { name: 'credit_amount', type: 'continuous', range: 'continuous' },
          { name: 'installment_as_income_perc', type: 'continuous', range: 'continuous' },
          { name: 'age', type: 'continuous', range: 'continuous' }
        ],
        target: { name: 'default', type: 'categorical', range: [0, 1] },
        method: { name: 'RankSVM' },
        sumDistortion: 0,
        instances: [],
        stat: {
          accuracy: 0,
          goodnessOfFairness: 0,
          sp: 0,
          tp: 0,
          fp: 0
        }
      },
      output: [],
      pairwiseInputDistances: [],
      permutationInputDistances: [],
      rankings: []
    };

    this.handleModelRunning = this.handleModelRunning.bind(this);
    this.handleSelectedRankingInterval = this.handleSelectedRankingInterval.bind(this);
    this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
    this.handleSensitiveAttr = this.handleSensitiveAttr.bind(this);
    this.handleMouseoverInstance = this.handleMouseoverInstance.bind(this);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (this.state.color !== nextState.color) { return true; }

  //   return false;
  // }

  componentWillMount() {
  }

  componentDidMount() {
    const _self = this;
    const { rankingInstance, selectedRankingInterval } = this.state,
          { instances } = rankingInstance;
    let inputs;

    // data file loading here
    function getDataset() {
      return fetch('/dataset/file')
              .then( (response) => {
                  return response.json() 
              })   
              .then( (file) => {
                const dataset = _.values(JSON.parse(file));

                _self.setState({
                  dataset: dataset,
                  n: dataset.length
                });
              });
    }

    function getFeatures() {
      return  fetch('/dataset/extractFeatures')
                .then( (response) => {
                  return response.json() 
                })
                .then( (response) => {
                  const features = _.values(JSON.parse(response));
                  console.log('features:', features);

                  _self.setState({
                    features: features
                  });
                });
    }
    
    // Response: All features, and values multiplied by weight
    function runRankSVM() {
      return  fetch('/dataset/runRankSVM/', {
                method: 'post',
                body: JSON.stringify(rankingInstance)
              })
              .then( (response) => {
                return response.json();
              })   
              .then( (response) => {
                  const rankingInstance = JSON.parse(response);
                  
                  _self.setState(prevState => ({
                    rankingInstance: rankingInstance,
                    rankings: [ ...prevState.rankings, rankingInstance ]
                  }));
                });
    }

    function calculatePairwiseInputDistance() {
      return  fetch('/dataset/calculatePairwiseInputDistance/', {
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
                  
                  _self.setState({
                    pairwiseInputDistances: pairwiseInputDistances,
                    permutationInputDistances: permutationInputDistances
                  });
                });
    }

    // Response: Dim coordinates
    function runMDS() {
      return fetch('/dataset/runMDS/', {
                method: 'post',
                body: JSON.stringify(rankingInstance)
              })
              .then( (response) => {
                return response.json();
              })   
              .then( (responseOutput) => {
                  const dimReductions = _.values(JSON.parse(responseOutput));
                  console.log('mds result: ', dimReductions);
                  
                  _self.setState({inputCoords: dimReductions});
                });
    }

    function getFetches(){
      return Promise.all([getDataset(), getFeatures(), runRankSVM(), 
        calculatePairwiseInputDistance(), runMDS()])
    }

    getFetches()
    .then((responses) => {
      console.log(responses);
      this.calculatePairwiseDiffs();
      this.calculatePermutationDiffs();
      this.permutationDiffsFlattened = _.flatten(this.permutationDiffs);
      this.calculateRSquared(this.pairwiseDiffs);
      this.calculatePredictionIntervalandOutliers(this.pairwiseDiffs);
      this.calculateSumDistortion(instances, this.permutationDiffsFlattened);
      this.calculateNDM(this.permutationDiffs);

      this.setState((prevState) => ({
        pairwiseDiffs: this.pairwiseDiffs,
        permutationDiffs: this.permutationDiffs,
        permutationDiffsFlattened: this.permutationDiffsFlattened,
        rankingInstance: {
          ...prevState.rankingInstance,
          stat: {
            ...prevState.rankingInstance.stat,
            goodnessOfFairness: this.rSquared
          }
        }
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

  handleRankingInstanceOptions(optionObj) {  // optionObj e.g., { sensitiveAttr: 'sex' }
    const { features, methods } = this.state;
    
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
    const { rankingInstance } = this.state;
    rankingInstance.rankingId += 1;

    this.setState(prevState => ({
      rankingInstance: {
        ...prevState.rankingInstance,
        rankingId: prevState.rankingInstance.rankingId + 1
      }
    }));
    
    fetch('/dataset/run' + rankingInstance.method.name + '/', {
      method: 'post',
      body: JSON.stringify(rankingInstance)
    })
    .then( (response) => {
      return response.json();
    })   
    .then( (response) => {
      const rankingInstance = JSON.parse(response);

      fetch('/dataset/calculatePairwiseInputDistance/', {
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
          rankingInstance: rankingInstance,
          pairwiseInputDistances: pairwiseInputDistances,
          permutationInputDistances: permutationInputDistances
        });
      });

      fetch('/dataset/runMDS/', {
        method: 'post',
        body: JSON.stringify(rankingInstance)
      })
      .then( (response) => {
        return response.json();
      })   
      .then( (responseOutput) => {
        const dimReductions = _.values(JSON.parse(responseOutput));
        console.log('mds result: ', dimReductions);
        
        this.setState({
          inputCoords: dimReductions
        });
      });
      
    });
  }
  
  handleSelectedRankingInterval(interval) {
    console.log('interval change: ', interval);
    this.setState({
      selectedRankingInterval: { from: interval.from, to: interval.to }
    });
  }

  handleSelectedTopk(topk) {
    console.log('topk in App.js: ', topk);
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
          pairs = pairwise(instances);

    _self.setScalesFromDataPairs(pairwiseInputDistances, pairs);

    // Get difference between input space(from dataPairwiseInputDistances) and output space(from dataPairs.output.ranking)
    let pairwiseDiffs = [];
    for(let i=0; i<pairs.length-1; i++){
      let diffInput = pairwiseInputDistances[i].input_dist,
          diffOutput = Math.abs(pairs[i][0].instance.ranking - pairs[i][1].instance.ranking),
          pair = 0;

      if((pairs[i][0].group === 0) && (pairs[i][1].group === 0))
        pair = 1;
      else if((pairs[i][0].group === 1) && (pairs[i][1].group === 1))
        pair = 2;
      else if(pairs[i][0].group !== pairs[i][1].group)
        pair = 3;

      pairwiseDiffs.push({
        idx1: pairs[i][0].idx,
        idx2: pairs[i][1].idx,
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

    this.pairwiseDiffs = pairwiseDiffs;
  }

  // Calculate distortions of permutational pairs (For matrix view)
  calculatePermutationDiffs() {
    const _self = this;

    const instances = _self.combineInputsAndOutputs(),
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
    _.forEach(instances, (d, i) => {
      instances[i].sumDistortion = permutationDiffs
          .filter((e) => e.idx1 === instances[i].idx)
          .map((e) => e.absDistortion)
          .reduce((sum, e) => sum + e);
    });
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
    let SSE_arr = [], SST_arr = [],
        SSE, SST, rSquared,
        n = pairwiseDiffs.length,
        meanY = _.sum(_.map(pairwiseDiffs, (d) => d.distortion)) / n;
    
    _.each(pairwiseDiffs, (d) => {
      SSE_arr.push(Math.pow(d.distortion - 0, 2));
      SST_arr.push(Math.pow(meanY - d.distortion, 2));
    });

    SSE = _.sum(SSE_arr);
    SST = _.sum(SST_arr);
    
    this.rSquared = Math.round((1 - (SSE / SST)) * 100) / 100;
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
    const topk = this.state.topk,
          rankingInstance = this.state.rankingInstance,
          rankings = this.state.rankings,
          dataset = this.state.dataset,
          selectedRankingId = this.state.selectedRanking,
          selectedRanking = rankings[selectedRankingId];

    console.log('state: ', this.state);

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
            rankingInstance={this.state.rankingInstance}
            topk={this.state.topk}
            n={this.state.n}
            onSelectRankingInstanceOptions={this.handleRankingInstanceOptions}
            onRunningModel={this.handleModelRunning}
            onSelectProtectedGroup={this.handleSensitiveAttr} />
        <RankingView 
            n={this.state.n}
            topk={this.state.topk}
            selectedRankingInterval={this.state.selectedRankingInterval}
            data={this.state.rankingInstance}
            onSelectedRankingInterval={this.handleSelectedRankingInterval}
            onSelectedTopk={this.handleSelectedTopk}  />
        <InputSpaceView 
            className={styles.InputSpaceView}
            data={this.state.rankingInstance}
            topk={this.state.topk}
            inputCoords={this.state.inputCoords}
            selectedInstance={this.state.selectedInstance}
            selectedRankingInterval={this.state.selectedRankingInterval} 
            onMouseoverInstance={this.handleMouseoverInstance} />
        <IndividualInspectionView
            className={styles.IndividualInspectionView}
            data={this.state.rankingInstance}
            topk={this.state.topk}
            selectedInstance={this.state.selectedInstance}
            selectedRankingInterval={this.state.selectedRankingInterval} />
        <IndividualFairnessView 
            data={this.state.rankingInstance}
            n={this.state.n}
            selectedInstance={this.state.selectedInstance}
            selectedRankingInterval={this.state.selectedRankingInterval}
            pairwiseInputDistances={this.state.pairwiseInputDistances}
            permutationInputDistances={this.state.permutationInputDistances}
            pairwiseDiffs={this.pairwiseDiffs}
            permutationDiffs={this.permutationDiffs}
            permutationDiffsFlattened={this.permutationDiffsFlattened}
            confIntervalPoints={this.state.confIntervalPoints}
            inputCoords={this.state.inputCoords} />
        <GroupFairnessView 
            className={styles.GroupFairnessView}
            data={this.state.rankingInstance} 
            topk={this.state.topk}  />
        <Footer />
      </div>
    );
  }
}

export default App;
