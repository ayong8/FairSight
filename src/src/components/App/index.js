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
      selectedDataset: [],  // A subset of the dataset that include features, target, and idx
      inputCoords: [],
      weights: {},
      sensitiveAttr: 'sex',
      selectedRanking: 0, // Index of a ranking selected among rankings in 'rankings'
      selectedRankingInterval: {
        from: 0,
        to: 10
      },
      rankingInstance: {
        rankingId: 1,
        sensitiveAttr: 'sex',
        features: ['credit_amount', 'installment_as_income_perc', 'age'],
        target: 'default',
        method: 'RankSVM',
        sumDistortion: 0
      },
      output: [],
      pairwiseInputDistances: [],
      permutationInputDistances: [],
      rankings: [
        [
          { ranking: 1, score: 90, group: 1 },
          { ranking: 2, score: 88, group: 2 },
          { ranking: 3, score: 85, group: 1 },
          { ranking: 4, score: 80, group: 1 },
          { ranking: 5, score: 77, group: 2 },
          { ranking: 6, score: 75, group: 1 },
          { ranking: 7, score: 73, group: 2 },
          { ranking: 8, score: 70, group: 2 }
        ],
        [
          { ranking: 1, score: 90, group: 1 },
          { ranking: 2, score: 88, group: 1 },
          { ranking: 3, score: 85, group: 1 },
          { ranking: 4, score: 82, group: 1 },
          { ranking: 5, score: 80, group: 2 },
          { ranking: 6, score: 78, group: 1 },
          { ranking: 7, score: 75, group: 2 },
          { ranking: 8, score: 70, group: 1 }
        ]
      ]
    };

    this.handleModelRunning = this.handleModelRunning.bind(this);
    this.handleRankingInstanceOptions = this.handleRankingInstanceOptions.bind(this);
  }

  componentDidMount() {
    const rankingInstance = this.state.rankingInstance;

    // data file loading here
    fetch('/dataset/file')
      .then( (response) => {
          return response.json() 
        })   
        .then( (file) => {
            let dataset = _.values(JSON.parse(file));
            console.log('whole dataset:', dataset);

            this.setState({dataset: dataset});
          });

    fetch('/dataset/getWeight')
      .then( (response) => {
        return response.json();
      })   
      .then( (responseWeight) => {
          let weights = JSON.parse(responseWeight)[0];
          
          this.setState({weights: weights});
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
          
          console.log('ranRankSVM instance: ', rankingInstance);
          this.setState({rankingInstance: rankingInstance});
        });

    fetch('/dataset/getSelectedDataset')
      .then( (response) => {
        return response.json();
      })   
      .then( (response) => {
          let selectedDataset = _.values(JSON.parse(response));
          
          this.setState({selectedDataset: selectedDataset});
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

  render() {
    if ((!this.state.rankingInstance || this.state.rankingInstance.length === 0) || 
        (!this.state.inputCoords || this.state.inputCoords.length === 0) ||
        (!this.state.pairwiseInputDistances || this.state.pairwiseInputDistances.length === 0) || 
        (!this.state.topk)
       ) {
      return <div />
    }
    console.log('rankingInstance: ', this.state.rankingInstance);
    // For the Ranking Inspector, only send down the selected ranking data
    const topk = this.state.topk,
          rankingList = this.state.rankings,
          dataset = this.state.dataset,
          selectedRankingId = this.state.selectedRanking,
          selectedRanking = rankingList[selectedRankingId];

    return (
      <div className={styles.App}>
        <div className={styles.titleBar}></div>
        <Menubar topk={topk} 
                 datasetName='german.csv' 
                 onSelectSensitiveAttr={this.handleSelectSensitiveAttr} />
        <RankingsListView rankings={this.state.rankings} />
        <RankingInspector topk={this.state.topk}
                          dataset={this.state.dataset}
                          rankingInstance={this.state.rankingInstance}
                          selectedDataset={this.state.selectedDataset}
                          inputCoords={this.state.inputCoords}
                          pairwiseInputDistances={this.state.pairwiseInputDistances}
                          permutationInputDistances={this.state.permutationInputDistances}
                          ranking={selectedRanking} 
                          onRunningModel={this.handleModelRunning}
                          onHandleRankingInstanceOptions={this.handleRankingInstanceOptions} />
        <Footer />
      </div>
    );
  }
}

export default App;
