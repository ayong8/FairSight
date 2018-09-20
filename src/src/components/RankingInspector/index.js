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

class RankingInspector extends Component {
  constructor(props) {
    super(props);

    this.handleModelRunning = this.handleModelRunning.bind(this);
    this.handleMouseoverInstance = this.handleMouseoverInstance.bind(this);
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
    this.handleSelectedRankingInterval = this.handleSelectedRankingInterval.bind(this);
    this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.topk !== nextProps.topk) { return true; }
    if (this.props.dataset !== nextProps.dataset) { return true; }
    if (this.props.rankingInstance !== nextProps.rankingInstance) { return true; }
    if (this.props.selectedInstance !== nextProps.selectedInstance) { return true; }
    if (this.props.selectedRankingInterval !== nextProps.selectedRankingInterval) { return true; }

    return false;
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
        <RankingView n={this.props.n}
                     topk={this.props.topk}
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
                                n={this.props.n}
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
