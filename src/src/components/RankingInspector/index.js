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

    this.state = {
      selectedIndividual: 2, // idx
      selectedRankingInterval: {
        start: 10,
        end: 20
      }
    }
  }

  combineData() {
    const dataInputCoords = this.props.inputCoords,
          dataOutput = this.props.output,
          idx = _.map(dataOutput, (d) => d.idx);

    console.log('inputCoords: ', dataInputCoords);

    let data = [];

    // Union 
    data = _.map(idx, (currentIdx) => {
        let inputObj = _.find(dataInputCoords, {'idx': currentIdx}),
            outputObj = _.find(dataOutput, {'idx': currentIdx});

        return {
          idx: currentIdx,
          group: inputObj.group,
          inputCoords: inputObj,
          output: outputObj
        }
      });

    return data;
  }
  // Calculate distortions of combinatorial pairs (For pairwise distortion plot)
  calculatePairwiseDiffs() {
    const data = this.combineData(),
          dataPairs = pairwise(data);    

    this.setScalesFromDataPairs(dataPairs);

    let dataPairwiseDiffs = [];
    
    dataPairwiseDiffs = _.map(dataPairs, (d) => {
          let diffInput = Math.sqrt(Math.pow(d[0].inputCoords.dim1 - d[1].inputCoords.dim1, 2) + Math.pow(d[0].inputCoords.dim2 - d[1].inputCoords.dim2, 2)),
              diffOutput = Math.abs(d[0].output.ranking - d[1].output.ranking),
              pair = 0;

          if((d[0].group === 1) && (d[1].group === 1))
            pair = 1;
          else if((d[0].group === 2) && (d[1].group === 2))
            pair = 2;
          else if(d[0].group !== d[1].group)
            pair = 3;

          return {
            idx1: d[0].idx,
            idx2: d[1].idx,
            pair: pair,
            diffInput: diffInput,
            diffOutput: diffOutput,
            scaledDiffInput: this.inputScale(diffInput),
            scaledDiffOutput: this.outputScale(diffOutput)
          }
        });

    return dataPairwiseDiffs;
  }

  // Calculate distortions of permutational pairs (For matrix view)
  calculatePermutationPairwiseDiffs() {
    const data = this.combineData();
    let dataPermutationDiffs = []; // 2D-array

    _.forEach(data, (obj1) => {
        let row = [];
        _.forEach(data, (obj2) => {
          const diffInput = Math.sqrt(Math.pow(obj1.inputCoords.dim1 - obj2.inputCoords.dim1, 2) + 
                         Math.pow(obj1.inputCoords.dim2 - obj2.inputCoords.dim2, 2)),
                diffOutput = Math.abs(obj1.output.ranking - obj2.output.ranking);
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
            pair: pair,
            diffInput: diffInput,
            diffOutput: diffOutput,
            scaledDiffInput: this.inputScale(diffInput),
            scaledDiffOutput: this.outputScale(diffOutput),
            x1: obj1.output['credit_amount'],
            x2: obj2.output['age']
          });
        });
        dataPermutationDiffs.push(row);
    });

    return dataPermutationDiffs;
  }

  setScalesFromDataPairs(dataPairs){
    this.inputScale = d3.scaleLinear()
        .domain(d3.extent(dataPairs, (d) => 
            Math.sqrt(Math.pow(d[0].inputCoords.dim1 - d[1].inputCoords.dim1, 2) + 
                      Math.pow(d[0].inputCoords.dim2 - d[1].inputCoords.dim2, 2))
                    )
        )
        .range([0, 1]);
    this.outputScale = d3.scaleLinear()
        .domain(d3.extent(dataPairs, (d) => 
            Math.abs(d[0].output.ranking - d[1].output.ranking))
        )
        .range([0, 1]);
  }

  render() {
    var data = [1,2,3,4,5];

    // Data
    let selectedFeatures = this.props.selectedFeatures,
        selectedDataset = this.props.selectedDataset,
        sensitiveAttr = this.props.sensitiveAttr,
        output = this.props.output;

    console.log(this.props);
    console.log('sensitiveAttr: ', sensitiveAttr);
    console.log('output: ', output);
          
    let idx = _.map(selectedDataset, (d) => d.idx),
          x = _.map(selectedDataset, (d) => _.pick(d, [...selectedFeatures, 'idx'])),
          y = _.map(selectedDataset, (d) => _.pick(d, ['default', 'idx'])),
          groups = _.map(selectedDataset, (d) => _.pick(d, [sensitiveAttr, 'idx'])),
          rankings = _.map(output, (d) => _.pick(d, ['ranking', 'idx'])),
          scores = _.map(output, (d) => _.pick(d, ['score', 'idx']));

    // Merge multiple datasets (objects) as one object with all attributes together in each data point
    // x, y, diffs, diffsInPermutations
    
    const dataIndividualFairnessView = _.map(idx, (currentIdx) => {
            const xObj = _.find(x, {'idx': currentIdx}),
                  yObj = _.find(y, {'idx': currentIdx})['default'],
                  groupObj = _.find(groups, {'idx': currentIdx}),
                  rankingObj = _.find(rankings, {'idx': currentIdx}),
                  scoreObj = _.find(scores, {'idx': currentIdx});

            return {
              idx: currentIdx,
              x: xObj,
              y: yObj,
              group: groupObj[sensitiveAttr],
              ranking: rankingObj.ranking,
              score: scoreObj.score
            }
          }),

          dataGroupFairnessView = _.map(idx, (currentIdx) => {
            const xObj = _.find(x, {'idx': currentIdx}),
                  yObj = _.find(y, {'idx': currentIdx})['default'],
                  groupObj = _.find(groups, {'idx': currentIdx}),
                  rankingObj = _.find(rankings, {'idx': currentIdx}),
                  scoreObj = _.find(scores, {'idx': currentIdx});

            return {
              idx: currentIdx,
              x: xObj,
              y: yObj,
              group: groupObj[sensitiveAttr],
              ranking: rankingObj.ranking,
              score: scoreObj.score
            }
          });

    return (
      <div className={styles.RankingInspector}>
        <Generator className={styles.Generator} />
        <RankingView topk={this.props.topk} ranking={this.props.ranking} output={this.props.output} />
        <InputSpaceView inputCoords={this.props.inputCoords} className={styles.InputSpaceView} />
        <GroupFairnessView data={dataGroupFairnessView}
                           output={this.props.output} 
                           topk={this.props.topk} 
                           ranking={this.props.ranking} 
                           wholeRanking={this.props.wholeRanking} className={styles.GroupFairnessView} />
        <IndividualFairnessView data={dataIndividualFairnessView}
                                pairwiseDiffs={this.calculatePairwiseDiffs()}
                                pairwiseDiffsInPermutation={this.calculatePermutationPairwiseDiffs()}
                                />
        {/* <UtilityView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.UtilityView} /> */}
      </div>
    );
  }
}

export default RankingInspector;
