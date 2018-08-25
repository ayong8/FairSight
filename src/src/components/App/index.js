import React, { Component } from "react";
import { connect } from 'react-redux';
//import { setTopk } from './actions';

import * as d3 from 'd3';
import _ from 'lodash';
import { Button } from 'reactstrap';
import styles from "./styles.scss";

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
      selectedFeatures: ['credit_amount', 'installment_as_income_perc', 'sex', 'age'],
      selectedTarget: 'default',
      topk: 20,
      selectedDataset: [],
      label: 'default',
      weights: {},
      output: [],
      sensitiveAttr: 'sex',
      selectedRanking: 0, // Index of a ranking selected among rankings in 'rankings'
      rankingInstance: {
        rankingId: '',
        sensitiveAttr: '',
        features: [],
        target: '',
        method: ''
      },
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
      ],
      wholeRanking: [
        { ranking: 1, score: 90, group: 1 },
        { ranking: 2, score: 88, group: 2 },
        { ranking: 3, score: 85, group: 1 },
        { ranking: 4, score: 82, group: 1 },
        { ranking: 5, score: 80, group: 2 },
        { ranking: 6, score: 78, group: 1 },
        { ranking: 7, score: 75, group: 1 },
        { ranking: 8, score: 75, group: 1 },
        { ranking: 9, score: 74, group: 1 },
        { ranking: 10, score: 73, group: 2 },
        { ranking: 11, score: 71, group: 1 },
        { ranking: 12, score: 70, group: 1 },
        { ranking: 13, score: 70, group: 1 },
        { ranking: 14, score: 70, group: 1 },
        { ranking: 15, score: 70, group: 2 },
        { ranking: 16, score: 70, group: 2 },
        { ranking: 17, score: 70, group: 1 },
        { ranking: 18, score: 70, group: 1 },
        { ranking: 19, score: 70, group: 2 },
        { ranking: 20, score: 69, group: 1 },
        { ranking: 21, score: 68, group: 1 },
        { ranking: 22, score: 67, group: 2 },
        { ranking: 23, score: 67, group: 1 },
        { ranking: 24, score: 67, group: 1 },
        { ranking: 25, score: 66, group: 1 },
        { ranking: 26, score: 66, group: 1 },
        { ranking: 27, score: 66, group: 1 },
        { ranking: 28, score: 66, group: 2 },
        { ranking: 29, score: 65, group: 1 },
        { ranking: 30, score: 64, group: 2 },
        { ranking: 31, score: 63, group: 1 },
        { ranking: 32, score: 62, group: 2 },
        { ranking: 33, score: 61, group: 2 },
        { ranking: 34, score: 61, group: 1 },
        { ranking: 35, score: 61, group: 2 },
        { ranking: 36, score: 61, group: 2 },
        { ranking: 37, score: 60, group: 1 },
        { ranking: 38, score: 58, group: 2 },
        { ranking: 39, score: 54, group: 2 },
        { ranking: 40, score: 50, group: 1 },
        { ranking: 41, score: 48, group: 2 },
        { ranking: 42, score: 44, group: 2 },
        { ranking: 43, score: 43, group: 1 },
        { ranking: 44, score: 42, group: 2 },
        { ranking: 45, score: 40, group: 2 },
        { ranking: 46, score: 38, group: 2 },
        { ranking: 47, score: 35, group: 2 },
        { ranking: 48, score: 33, group: 1 },
        { ranking: 49, score: 26, group: 2 },
        { ranking: 50, score: 20, group: 2 }
      ],
      observedAndDecisions: [
        {observed: 1, decision: 1},
        {observed: 3, decision: 4},
        {observed: 5, decision: 4},
        {observed: 7, decision: 10},
        {observed: 8, decision: 7},
        {observed: 8, decision: 7},
        {observed: 10, decision: 12},
        {observed: 13, decision: 13},
        {observed: 15, decision: 16},
        {observed: 16, decision: 15},
        {observed: 18, decision: 13},
        {observed: 19, decision: 22},
        {observed: 20, decision: 24},
        {observed: 21, decision: 23},
        {observed: 23, decision: 25},
        {observed: 25, decision: 22},
        {observed: 27, decision: 30},
        {observed: 30, decision: 32},
        {observed: 32, decision: 28}
      ],
      inputCoords: []
    };

    this.handleModelRunning = this.handleModelRunning.bind(this);
  }

  componentDidMount() {
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
    fetch('/dataset/runRankSVM')
      .then( (response) => {
        return response.json();
      })   
      .then( (responseOutput) => {
          let output = _.values(JSON.parse(responseOutput));
          
          this.setState({output: output});
        });

    fetch('/dataset/getSelectedDataset')
      .then( (response) => {
        return response.json();
      })   
      .then( (response) => {
          let selectedDataset = _.values(JSON.parse(response));
          
          this.setState({selectedDataset: selectedDataset});
        });

    fetch('/dataset/calculatePairwiseInputDistance')
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
    // fetch('/dataset/setSensitiveAttr', {
    //     method: 'post',
    //     body: JSON.stringify(this.state.sensitiveAttr)
    //   })
    //   .then( (response) => {
    //     return response.json();
    //   })   
    //   .then( (response) => {
    //       let selectedDataset = _.values(JSON.parse(response));
    //       console.log('selectedDataset: ', selectedDataset);
          
    //       this.setState({selectedDataset: selectedDataset});
    //     });
  }

  setGroupsFromSensitiveAttr() {
    const sensitiveAttr = this.state.sensitiveAttr,
          output = this.state.output,
          dataSensitiveAttr = this.state.selectedDataset[sensitiveAttr];
    let groups = [];

    // Extract all categories from the feature
    groups = ['male', 'female'];

    // Set the group key as 1 or 2 to this.state.output
    // Sensitive attribute can be obtained from selectedDataset
    
    this.state.selectedDataset;
  }

  calculateScores() {
    let weights = this.state.weights;
    let wholeDataset = this.state.dataset;
    let selectedFeatures = this.state.selectedFeatures;
    let dataset, weightedDataset;

    dataset = _.map(wholeDataset, (d) => _.pick(d, selectedFeatures));
  }

  handleModelRunning(rankingInstance){
		this.setState({
      rankingInstance: rankingInstance
    });

    fetch('/dataset/runModel/', {
        method: 'post',
        body: JSON.stringify(rankingInstance)
      })
      .then( (response) => {
        return response.json();
      })   
      .then( (response) => {
          let selectedDataset = _.values(JSON.parse(response));
          console.log('selectedDataset: ', selectedDataset);
          
          this.setState({selectedDataset: selectedDataset});
        });
	}

  render() {
    if ((!this.state.selectedDataset || this.state.output.length === 0) || 
        (!this.state.output || this.state.output.length === 0) ||
        (!this.state.inputCoords || this.state.inputCoords.length === 0) ||
        (!this.state.pairwiseInputDistances || this.state.pairwiseInputDistances.length === 0) || 
        (!this.state.topk)
       ) {
      return <div />
    }
    // For the Ranking Inspector, only send down the selected ranking data
    let topk = this.state.topk,
        rankingList = this.state.rankings,
        wholeDataset = this.state.dataset,
        selectedRankingIndex = this.state.selectedRanking,
        selectedRanking = rankingList[selectedRankingIndex];

    return (
      <div className={styles.App}>
        <div className={styles.titleBar}></div>
        <Menubar topk={topk} 
                 datasetName='german.csv' 
                 onSelectSensitiveAttr={this.handleSelectSensitiveAttr} />
        <RankingsListView rankings={this.state.rankings} />
        <RankingInspector topk={topk}
                          wholeDataset={this.state.dataset}
                          selectedDataset={this.state.selectedDataset}
                          selectedFeatures={this.state.selectedFeatures}
                          selectedTarget={this.state.selectedTarget}
                          sensitiveAttr={this.state.sensitiveAttr}
                          inputCoords={this.state.inputCoords}
                          pairwiseInputDistances={this.state.pairwiseInputDistances}
                          permutationInputDistances={this.state.permutationInputDistances}
                          observedAndDecisions={this.state.observedAndDecisions}
                          output={this.state.output} 
                          ranking={selectedRanking} 
                          onRunningModel={this.handleModelRunning}/>
        <Footer />
      </div>
    );
  }
  // componentWillMount() {
  //   csv('./data/german.csv', (error, data) => {
  //     if (error) {
  //       this.setState({loadError: true});
  //     }
  //     this.setState({
  //       data: data.map(d => ({...d, x: Number(d.birth), y: Number(d.death)}))
  //     });
  //   })
  // }
}

// function select(state) {
    
// }

export default App;
