import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import Generator from './Generator';
import InputSpaceView from './inputSpaceView';
import RankingView from './rankingView';
import IndividualFairnessView from './individualFairnessView';
import GroupFairnessView from './groupFairnessView';
import UtilityView from './utilityView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

_.rename = function(obj, key, newKey) {
  
  if(_.includes(_.keys(obj), key)) {
    obj[newKey] = _.clone(obj[key], true);

    delete obj[key];
  }
  
  return obj;
};

function pairwise(list) {
  if (list.length < 2) { return []; }
  var first = list[0],
      rest  = list.slice(1),
      pairs = rest.map(function (x) { return [first, x]; });
  return pairs.concat(pairwise(rest));
}


class RankingInspector extends Component {
  constructor(props) {
    super(props);

    this.inputScale;
    this.outputScale;

    this.handleModelRunning = this.handleModelRunning.bind(this);
    this.handleMouseoverInstance = this.handleMouseoverInstance.bind(this);
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
    this.handleSelectedRankingIntervalChange = this.handleSelectedRankingIntervalChange.bind(this);
  }

  combineData() {
    console.log('in combineData: ', this.props.rankingInstance);
    const dataInputCoords = this.props.inputCoords,
          selectedRankingInterval = this.props.selectedRankingInterval,
          data = this.props.rankingInstance,
          instances = data.instances.slice(selectedRankingInterval.from, selectedRankingInterval.to),
          idx = _.map(instances, (d) => d.idx);

    let combinedData = [];

    // Union 
    combinedData = _.map(idx, (currentIdx) => {
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
    const data = this.combineData(),
          dataPairwiseInputDistances = this.props.pairwiseInputDistances,
          dataPairs = pairwise(data);   

    this.setScalesFromDataPairs(dataPairwiseInputDistances, dataPairs);

    let dataPairwiseDiffs = [];
    // Get difference between input space(from dataPairwiseInputDistances) and output space(from dataPairs.output.ranking)
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
        scaledDiffInput: this.inputScale(diffInput),
        scaledDiffOutput: this.outputScale(diffOutput),
        distortion: this.outputScale(diffOutput) - this.inputScale(diffInput),
        absDistortion: Math.abs(this.outputScale(diffOutput) - this.inputScale(diffInput)),
        isFair: false,
        isOutlier: false
      });
    }

    return dataPairwiseDiffs;
  }

  // Calculate distortions of permutational pairs (For matrix view)
  calculatePermutationPairwiseDiffs() {
    const data = this.combineData(),
          dataPermutationInputDistances = this.props.permutationInputDistances;

    console.log('calculatePermutationPairwiseDiffs: ', data, dataPermutationInputDistances)

    let dataPermutationDiffs = [], 
        input_idx = 0;

    _.forEach(data, (obj1) => {
        let row = [];
        _.forEach(data, (obj2) => {
          const diffInput = dataPermutationInputDistances[input_idx].input_dist,
                diffOutput = Math.abs(obj1.instance.ranking - obj2.instance.ranking);
          let pair = 0;

            if((obj1.group === 1) && (obj2.group === 1))
              pair = 1;
            else if((obj1.group === 2) && (obj2.group === 2))
              pair = 2;
            else if(obj1.group !== obj2.group)
              pair = 3;
          
          if(dataPermutationInputDistances[input_idx].idx1 !== obj1.idx)
            console.log('false for idx1')
          if(dataPermutationInputDistances[input_idx].idx2 !== obj2.idx)
            console.log('false for idx2')
          
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

    return dataPermutationDiffs;
  }

  setScalesFromDataPairs(dataPairwiseInputDistances, dataPairs){
    this.inputScale = d3.scaleLinear()
        .domain(d3.extent(dataPairwiseInputDistances, (d) => d.input_dist))
        .range([0, 1]);
    this.outputScale = d3.scaleLinear()
        .domain(d3.extent(dataPairs, (d) => 
            Math.abs(d[0].instance.ranking - d[1].instance.ranking))
        )
        .range([0, 1]);
  }

  handleRankingInstanceOptions(optionObj) {
    this.props.onHandleRankingInstanceOptions(optionObj);
  }

  handleSelectedRankingIntervalChange(interval) {
    this.props.onSelectedRankingIntervalChange(interval);
  }

  handleModelRunning() {
    this.props.onRunningModel();
  }

  handleMouseoverInstance(idx) {
    this.setState({
      selectedInstance: idx
    });
  }

  render() {
    if (!this.props.rankingInstance || this.props.rankingInstance.length === 0)
        {
      return <div />
    }
    // Data
    const rankingInstance = this.props.rankingInstance,
          features = rankingInstance.features,
          sensitiveAttr = rankingInstance.sensitiveAttr;

    return (
      <div className={styles.RankingInspector}>
        <Generator className={styles.Generator}
                   dataset={this.props.dataset}
                   data={this.props.rankingInstance}
                   topk={this.props.topk}
                   n={this.props.n}
                   onSelectRankingInstanceOptions={this.handleRankingInstanceOptions}
                   onRunningModel={this.handleModelRunning}/>
        <RankingView topk={this.props.topk}
                     selectedRankingInterval={this.props.selectedRankingInterval}
                     data={this.props.rankingInstance}
                     onSelectedRankingIntervalChange={this.handleSelectedRankingIntervalChange} />
        <InputSpaceView className={styles.InputSpaceView}
                        data={this.props.rankingInstance}
                        inputCoords={this.props.inputCoords}
                        selectedInstance={this.props.selectedInstance}
                        selectedRankingInterval={this.props.selectedRankingInterval} 
                        onMouseoverInstance={this.handleMouseoverInstance} />
        <IndividualFairnessView data={this.props.rankingInstance}
                                pairwiseDiffs={this.calculatePairwiseDiffs()}
                                pairwiseDiffsInPermutation={this.calculatePermutationPairwiseDiffs()}
                                selectedInstance={this.props.selectedInstance}
                                selectedRankingInterval={this.props.selectedRankingInterval}
                                />
        <GroupFairnessView className={styles.GroupFairnessView}
                           data={this.props.rankingInstance} 
                           topk={this.props.topk} />
      </div>
    );
  }
}

export default RankingInspector;
