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
      rankingInstance: {
        rankingId: '',
        sensitiveAttr: 'sex',
        features: ['credit_amount', 'installment_as_income_perc', 'age'],
        target: 'default',
        method: 'rankSVM'
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
        <RankingInspector topk={this.state.topk}
                          wholeDataset={this.state.dataset}
                          rankingInstance={this.state.rankingInstance}
                          selectedDataset={this.state.selectedDataset}
                          // selectedFeatures={this.state.selectedFeatures}
                          // selectedTarget={this.state.selectedTarget}
                          // sensitiveAttr={this.state.rankingInstance.sensitiveAttr}
                          inputCoords={this.state.inputCoords}
                          pairwiseInputDistances={this.state.pairwiseInputDistances}
                          permutationInputDistances={this.state.permutationInputDistances}
                          output={this.state.output} 
                          ranking={selectedRanking} 
                          onRunningModel={this.handleModelRunning}
                          onHandleRankingInstanceOptions={this.handleRankingInstanceOptions} />
        <Footer />
      </div>
    );
  }
}

export default App;
