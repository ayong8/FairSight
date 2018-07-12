import React, { Component } from "react";
import * as d3 from 'd3';
import { Button } from 'reactstrap';
import styles from "./styles.scss";

import Footer from "components/Footer";
import Generator from 'components/Generator';
import RankingInspector from 'components/RankingInspector';
import RankingsListView from 'components/RankingsListView';
import TableView from 'components/TableView';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataset: {},
      sensitiveAttr: 'sex',
      selectedRanking: 0, // Index of a ranking selected among rankings in 'rankings'
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
      distortions: [
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
      ]
    };
  }

  componentDidMount() {
    // data file loading here
    // fetch("./data/german_credit_sample.json")
    //   .then( (response) => {
    //       console.log(response);
    //       return response.json() })   
    //           .then( (json) => {
    //               console.log(json);
    //               this.setState({dataset: json});
    //           });
  }

  render() {
    // For the Ranking Inspector, only send down the selected ranking data
    let rankingList = this.state.rankings,
        selectedRankingIndex = this.state.selectedRanking,
        selectedRanking = rankingList[selectedRankingIndex];

    return (
      <div className={styles.App}>
        <div className={styles.titleBar}>
          <div className={styles.appTitle}>FairSight</div>
        </div>
        <Generator dataset='german.csv' />
        <RankingsListView rankings={this.state.rankings} />
        <TableView />
        <RankingInspector distortions={this.state.distortions} wholeRanking={this.state.wholeRanking} ranking={selectedRanking} />
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

export default App;
