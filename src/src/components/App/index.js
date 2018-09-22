import React, { Component } from "react";
import { connect } from 'react-redux';
//import { setTopk } from './actions';

import * as d3 from 'd3';
import _ from 'lodash';
import styles from "./styles.scss";
import 'antd/dist/antd.css';

import Menubar from 'components/Menubar';
import Generator from 'components/Generator';
import RankingsListView from 'components/RankingsListView';
import InputSpaceView from 'components/InputSpaceView';
import RankingView from 'components/RankingView';
import IndividualFairnessView from 'components/IndividualFairnessView';
import GroupFairnessView from 'components/GroupFairnessView';
import UtilityView from 'components/UtilityView';
import Footer from "components/Footer";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataset: [],
      features: [],
      topk: 20,
      n: 40,
      selectedDataset: [],  // A subset of the dataset that include features, target, and idx
      inputCoords: [],
      weights: {},
      sensitiveAttr: 'sex',
      selectedInstance: 1, // Index of a ranking selected among rankings in 'rankings'
      selectedRankingInterval: {
        from: 0,
        to: 50
      },
      rankingInstance: {
        rankingId: 1,
        sensitiveAttr: 'sex',
        features: ['credit_amount', 'installment_as_income_perc', 'age'],
        featureSpecs: [
          { name: 'credit_amount', type: 'continuous', range: 'continuous'},
          { name: 'income_perc', type: 'continuous', range: 'continuous'},
          { name: 'age', type: 'continuous', range: 'continuous'}
        ],
        target: 'default',
        method: 'RankSVM',
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
    this.handleMouseoverInstance = this.handleMouseoverInstance.bind(this);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (this.state.color !== nextState.color) { return true; }

  //   return false;
  // }

  componentDidMount() {
    const selectedRankingInterval = this.state.selectedRankingInterval,
          rankingInstance = this.state.rankingInstance;

    // data file loading here
    fetch('/dataset/file')
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

    fetch('/dataset/extractFeatures')
      .then( (response) => {
          return response.json() 
        })
        .then( (response) => {
          const features = _.values(JSON.parse(response));
          console.log('features:', features);

          this.setState({
            features: features
          });
        });
    
    // Response: All features, and values multiplied by weight
    fetch('/dataset/runRankSVM/', {
        method: 'post',
        body: JSON.stringify(rankingInstance)
      })
      .then( (response) => {
        return response.json();
      })   
      .then( (response) => {
          const rankingInstance = JSON.parse(response);
          
          this.setState(prevState => ({
            rankingInstance: rankingInstance,
            rankings: [ ...prevState.rankings, rankingInstance ]
          }));
        });

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
            pairwiseInputDistances: pairwiseInputDistances,
            permutationInputDistances: permutationInputDistances
          });
        });

    // Response: Dim coordinates
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
          
          this.setState({inputCoords: dimReductions});
        });
  }

  handleRankingInstanceOptions(optionObj) {  // optionObj e.g., { sensitiveAttr: 'sex' }
    console.log('passed option object to top component: ', optionObj)
    this.setState(prevState => ({
      rankingInstance: {
        ...prevState.rankingInstance,
        ...optionObj
      }
    }));
  }

  handleModelRunning(){
    let rankingInstance = this.state.rankingInstance;
    rankingInstance.rankingId += 1;

    this.setState(prevState => ({
      rankingInstance: {
        ...prevState.rankingInstance,
        rankingId: prevState.rankingInstance.rankingId + 1
      }
    }));
    
    fetch('/dataset/run' + rankingInstance.method + '/', {
        method: 'post',
        body: JSON.stringify(rankingInstance)
      })
      .then( (response) => {
        return response.json();
      })   
      .then( (response) => {
          const rankingInstance = JSON.parse(response);
          
          this.setState({
            rankingInstance: rankingInstance
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

  render() {
    if ((!this.state.rankingInstance || this.state.rankingInstance.length === 0) || 
        (!this.state.inputCoords || this.state.inputCoords.length === 0) ||
        (!this.state.pairwiseInputDistances || this.state.pairwiseInputDistances.length === 0) ||
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
        <Menubar topk={topk}
                 data={this.state.rankingInstance}
                 onSelectSensitiveAttr={this.handleSelectSensitiveAttr} />
        <RankingsListView rankings={this.state.rankings} />
        <Generator className={styles.Generator}
                   dataset={this.state.dataset}
                   features={this.state.features}
                   rankingInstance={this.state.rankingInstance}
                   topk={this.state.topk}
                   n={this.state.n}
                   onSelectRankingInstanceOptions={this.handleRankingInstanceOptions}
                   onRunningModel={this.handleModelRunning}/>
        <RankingView n={this.state.n}
                     topk={this.state.topk}
                     selectedRankingInterval={this.state.selectedRankingInterval}
                     data={this.state.rankingInstance}
                     onSelectedRankingInterval={this.handleSelectedRankingInterval}
                     onSelectedTopk={this.handleSelectedTopk} />
        <InputSpaceView className={styles.InputSpaceView}
                        data={this.state.rankingInstance}
                        topk={this.state.topk}
                        inputCoords={this.state.inputCoords}
                        selectedInstance={this.state.selectedInstance}
                        selectedRankingInterval={this.state.selectedRankingInterval} 
                        onMouseoverInstance={this.handleMouseoverInstance} />
        <IndividualFairnessView data={this.state.rankingInstance}
                                n={this.state.n}
                                selectedInstance={this.state.selectedInstance}
                                selectedRankingInterval={this.state.selectedRankingInterval}
                                pairwiseInputDistances={this.state.pairwiseInputDistances}
                                permutationInputDistances={this.state.permutationInputDistances}
                                inputCoords={this.state.inputCoords}
                                />
        <GroupFairnessView className={styles.GroupFairnessView}
                           data={this.state.rankingInstance} 
                           topk={this.state.topk} />
        {/* <RankingInspector topk={this.state.topk}
                          n={this.state.n}
                          dataset={this.state.dataset}
                          rankingInstance={rankingInstance}
                          selectedInstance={this.state.selectedInstance}
                          selectedRankingInterval={this.state.selectedRankingInterval}
                          inputCoords={this.state.inputCoords}
                          pairwiseInputDistances={this.state.pairwiseInputDistances}
                          permutationInputDistances={this.state.permutationInputDistances}
                          ranking={selectedRanking}
                          onSelectedRankingInterval={this.handleSelectedRankingInterval}
                          onSelectedTopk={this.handleSelectedTopk}  /> */}
        <UtilityView className={styles.UtilityView} />
        <Footer />
      </div>
    );
  }
}

export default App;
