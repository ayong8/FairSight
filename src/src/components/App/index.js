import React, { Component } from "react";
import { connect } from 'react-redux';
//import { setTopk } from './actions';

import * as d3 from 'd3';
import _ from 'lodash';
import { Button } from 'reactstrap';
import styles from "./styles.scss";
import 'antd/dist/antd.css';

import Footer from "components/Footer";
import Menubar from 'components/Menubar';
import RankingInspector from 'components/RankingInspector';
import RankingsListView from 'components/RankingsListView';
import TableView from 'components/TableView';

import dimReductionData from '../../data/dim_reduction_result.json';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataset: [],
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
        features: ['credit_amount', 'income_perc', 'age'],
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
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
  }

  componentDidMount() {
    const selectedRankingInterval = this.state.selectedRankingInterval,
          rankingInstance = this.state.rankingInstance;

    // data file loading here
    fetch('/dataset/file')
      .then( (response) => {
          return response.json() 
        })   
        .then( (file) => {
            let dataset = _.values(JSON.parse(file));
            console.log('whole dataset:', dataset);

            this.setState({
              dataset: dataset,
              n: dataset.length
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
          let rankingInstance = JSON.parse(response);
          console.log(rankingInstance);
          
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
          let json_response = JSON.parse(response),
              pairwiseInputDistances = json_response.pairwiseDistances,
              permutationInputDistances = json_response.permutationDistances;
          
          this.setState({
            pairwiseInputDistances: pairwiseInputDistances,
            permutationInputDistances: permutationInputDistances
          });
        });

    // Response: Dim coordinates
    fetch('/dataset/runMDS')
      .then( (response) => {
        return response.json();
      })   
      .then( (responseOutput) => {
          let dimReductions = _.values(JSON.parse(responseOutput));
          
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
    console.log(this.state.rankingInstance);
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

    console.log('run button toggled');
    console.log('rankingInstance: ', rankingInstance);
    
    fetch('/dataset/run' + rankingInstance.method + '/', {
        method: 'post',
        body: JSON.stringify(rankingInstance)
      })
      .then( (response) => {
        return response.json();
      })   
      .then( (response) => {
          const rankingInstance = JSON.parse(response);

          console.log('runmodel instance: ', rankingInstance);
          
          this.setState({
            rankingInstance: rankingInstance
          });
        });
  }
  
  handleSelectedRankingInstance(interval) {
    console.log('interval change: ', interval);
    this.setState({
      selectedRankingInterval: { from: interval[0], to: interval[1] }
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
    console.log('rankingInstance: ', this.state.rankingInstance);
    // For the Ranking Inspector, only send down the selected ranking data
    const topk = this.state.topk,
          rankings = this.state.rankings,
          dataset = this.state.dataset,
          selectedRankingId = this.state.selectedRanking,
          selectedRanking = rankings[selectedRankingId];

    console.log(rankings);

    return (
      <div className={styles.App}>
        <Menubar topk={topk}
                 data={this.state.rankingInstance}
                 datasetName='german.csv' 
                 onSelectSensitiveAttr={this.handleSelectSensitiveAttr} />
        <RankingsListView rankings={this.state.rankings} />
        <RankingInspector topk={this.state.topk}
                          n={this.state.n}
                          dataset={this.state.dataset}
                          rankingInstance={this.state.rankingInstance}
                          selectedDataset={this.state.selectedDataset}
                          selectedInstance={this.state.selectedInstance}
                          selectedRankingInterval={this.state.selectedRankingInterval}
                          inputCoords={this.state.inputCoords}
                          pairwiseInputDistances={this.state.pairwiseInputDistances}
                          permutationInputDistances={this.state.permutationInputDistances}
                          ranking={selectedRanking} 
                          onRunningModel={this.handleModelRunning}
                          onSelectedRankingIntervalChange={this.handleSelectedRankingInstance}
                          onHandleRankingInstanceOptions={this.handleRankingInstanceOptions} />
        <Footer />
      </div>
    );
  }
}

export default App;
