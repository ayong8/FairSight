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


class RankingInspector extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var data = [1,2,3,4,5];

    return (
      <div className={styles.RankingInspector}>
        <ProcessView inputCoords={this.props.inputCoords} distortions={this.props.distortions} ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.ProcessView} />
        <GroupFairnessView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.GroupFairnessView} />
        <UtilityView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.UtilityView} />
      </div>
    );
  }
}

class ProcessView extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.ProcessView}>
        <div className={styles.processIndicator}>
          <div className={index.title}>Input</div>
          <div className={index.title}>Individual Fairness</div>
          <div className={index.title}>Output</div>
        </div>
        <InputSpaceView inputCoords={this.props.inputCoords} className={styles.InputSpaceView} />
        <IndividualFairnessView distortions={this.props.distortions} ranking={this.props.ranking} className={styles.IndividualFairnessView} />
        <RankingView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} />
      </div>
    );
  }
}

export default RankingInspector;
