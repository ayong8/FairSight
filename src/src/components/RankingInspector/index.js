import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

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
    this.observedScale;
    this.decisionScale;

    //this.calculatePairwiseDistortions = this.calculatePairwiseDistortions.bind(this);
  }

  // Calculate distortions of combinatorial pairs (For pairwise distortion plot)
  calculatePairwiseDifferences() {
    let dataDimReductions = this.props.inputCoords,
          pairs = pairwise(dataDimReductions);

    _.map(dataDimReductions, (value, key) => 
          _.assign(value, {'idx': parseInt(key)}));

    console.log('dimReduction: ', dataDimReductions);
    // Get scores => then they are gonna consist of decision space
    console.log('pairs after pairwise(): ', pairs);

    this.observedScale = d3.scaleLinear()
        .domain(d3.extent(pairs, (d) => Math.sqrt(Math.pow(d[0].dim1 - d[1].dim1, 2) + Math.pow(d[0].dim2 - d[1].dim2, 2))))
        .range([0, 1]);
    this.observedScale = d3.scaleLinear()
        .domain(d3.extent(pairs, (d) => Math.sqrt(Math.pow(d[0].dim1 - d[1].dim1, 2) + Math.pow(d[0].dim2 - d[1].dim2, 2))))
        .range([0, 1]);

    let pairwise_dist = _.map(pairs, (d) => {
          let diffObserved = Math.sqrt(Math.pow(d[0].dim1 - d[1].dim1, 2) + Math.pow(d[0].dim2 - d[1].dim2, 2)),
              diffDecision = d[0].ranking - d[1].ranking;

          return {
            idx1: d[0].idx,
            idx2: d[1].idx,
            pair: Math.floor(Math.random() * 3) + 1,  // for now, pair is a random => (1: Woman and Woman, 2: Woman and Man, 3: Man and Man)
            observed: diffObserved,
            decision: diffDecision,
            scaled_observed: this.observedScale(diffObserved),
            scaled_decision: this.observedScale(diffDecision)
          }
        });

    return pairwise_dist;
  }

  // Calculate distortions of permutational pairs (For matrix view)
  calculatePermutationPairwiseDifferences() {
    const dataDimReductions = this.props.inputCoords;
    let pairs = [];

    console.log('dataDimReductions: ', dataDimReductions);

    _.forEach(dataDimReductions, (obj1) => {
        _.forEach(dataDimReductions, (obj2) => {
          let observed = Math.sqrt(Math.pow(obj1.dim1 - obj2.dim1, 2) + Math.pow(obj1.dim2 - obj2.dim2, 2));
          
          pairs.push({
            idx1: obj1.idx,
            idx2: obj2.idx,
            pair: Math.floor(Math.random() * 3) + 1,  // for now, pair is a random => (1: Woman and Woman, 2: Woman and Man, 3: Man and Man)
            observed: observed,
            decision: observed + (Math.random() - 0.5)
          });
        });
    });

    // Get scores => then they are gonna consist of decision space
    console.log('pairs from permutations: ', pairs);

    return pairs;
  }

  render() {
    var data = [1,2,3,4,5];

    const diffs = this.calculatePairwiseDifferences(),
          diffsInPermutation = this.calculatePermutationPairwiseDifferences();

    console.log(diffs);

    return (
      <div className={styles.RankingInspector}>
        <RankingView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} />
        <InputSpaceView inputCoords={this.props.inputCoords} className={styles.InputSpaceView} />
        <GroupFairnessView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.GroupFairnessView} />
        <IndividualFairnessView inputCoords={this.props.inputCoords} 
                                diffs={diffs}
                                diffsInPermutations={diffsInPermutation}
                                ranking={this.props.ranking} 
                                className={styles.IndividualFairnessView} />
        {/* <UtilityView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.UtilityView} /> */}
      </div>
    );
  }
}

export default RankingInspector;
