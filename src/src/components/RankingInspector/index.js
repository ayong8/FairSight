import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import Generator from './Generator';
import InputSpaceView from './inputSpaceView';
import RankingView from './RankingView';
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

    this.handleModelRunning = this.handleModelRunning.bind(this);
    this.handleMouseoverInstance = this.handleMouseoverInstance.bind(this);
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
    this.handleSelectedRankingInterval = this.handleSelectedRankingInterval.bind(this);
    this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
  }

  handleRankingInstanceOptions(optionObj) {
    this.props.onHandleRankingInstanceOptions(optionObj);
  }

  handleSelectedRankingInterval(interval) {
    this.props.onSelectedRankingInterval(interval);
  }

  handleSelectedTopk(topk) {
    this.props.onSelectedTopk(topk);
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
                     onSelectedRankingInterval={this.handleSelectedRankingInterval}
                     onSelectedTopk={this.handleSelectedTopk} />
        <InputSpaceView className={styles.InputSpaceView}
                        data={this.props.rankingInstance}
                        topk={this.props.topk}
                        inputCoords={this.props.inputCoords}
                        selectedInstance={this.props.selectedInstance}
                        selectedRankingInterval={this.props.selectedRankingInterval} 
                        onMouseoverInstance={this.handleMouseoverInstance} />
        <IndividualFairnessView data={this.props.rankingInstance}
                                selectedInstance={this.props.selectedInstance}
                                selectedRankingInterval={this.props.selectedRankingInterval}
                                pairwiseInputDistances={this.props.pairwiseInputDistances}
                                permutationInputDistances={this.props.permutationInputDistances}
                                inputCoords={this.props.inputCoords}
                                />
        <GroupFairnessView className={styles.GroupFairnessView}
                           data={this.props.rankingInstance} 
                           topk={this.props.topk} />
      </div>
    );
  }
}

export default RankingInspector;
