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
          { ranking: 4, score: 82, group: 1 },
          { ranking: 5, score: 80, group: 2 },
          { ranking: 6, score: 78, group: 1 },
          { ranking: 7, score: 75, group: 2 },
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
        { ranking: 7, score: 75, group: 2 },
        { ranking: 8, score: 70, group: 2 },
        { ranking: 9, score: 68, group: 1 },
        { ranking: 10, score: 67, group: 2 },
        { ranking: 11, score: 66, group: 1 },
        { ranking: 12, score: 65, group: 1 },
        { ranking: 13, score: 63, group: 2 },
        { ranking: 14, score: 62, group: 1 },
        { ranking: 15, score: 61, group: 2 },
        { ranking: 16, score: 60.5, group: 2 },
        { ranking: 17, score: 60, group: 1 },
        { ranking: 18, score: 58, group: 1 },
        { ranking: 19, score: 56, group: 2 },
        { ranking: 20, score: 55, group: 2 },
        { ranking: 21, score: 55, group: 1 },
        { ranking: 22, score: 54, group: 2 },
        { ranking: 23, score: 53.5, group: 2 },
        { ranking: 24, score: 53.2, group: 1 },
        { ranking: 25, score: 53.1, group: 2 },
        { ranking: 26, score: 52, group: 1 },
        { ranking: 27, score: 51, group: 1 },
        { ranking: 28, score: 50, group: 2 },
        { ranking: 29, score: 48, group: 1 },
        { ranking: 30, score: 47.6, group: 2 },
        { ranking: 31, score: 47.5, group: 1 },
        { ranking: 32, score: 47, group: 2 },
        { ranking: 33, score: 47, group: 1 },
        { ranking: 34, score: 47, group: 1 },
        { ranking: 35, score: 44, group: 2 },
        { ranking: 36, score: 43, group: 2 },
        { ranking: 37, score: 42, group: 1 },
        { ranking: 38, score: 41, group: 2 },
        { ranking: 39, score: 40, group: 2 },
        { ranking: 40, score: 39, group: 1 },
        { ranking: 41, score: 37, group: 2 },
        { ranking: 42, score: 36, group: 1 },
        { ranking: 43, score: 35, group: 1 },
        { ranking: 44, score: 34, group: 2 },
        { ranking: 45, score: 32, group: 1 },
        { ranking: 46, score: 31, group: 2 },
        { ranking: 47, score: 30, group: 2 },
        { ranking: 48, score: 28, group: 1 },
        { ranking: 49, score: 26, group: 2 },
        { ranking: 50, score: 20, group: 1 }
      ]
    };
  }

  componentDidMount() {
    // data file loading here
    d3.csv('../../data/german_credit_sample.csv', function(data) {
      console.log("sample dataset: ", data);
    });
  }

  render() {
    // For the Ranking Inspector, only send down the selected ranking data
    let rankingList = this.state.rankings,
        selectedRankingIndex = this.state.selectedRanking,
        selectedRanking = rankingList[selectedRankingIndex];

    return (
      <div className={styles.App}>
        <div className={styles.titleBar}>
          <div className={styles.title}>FairSight</div>
        </div>
        <Generator dataset='german.csv' />
        <RankingsListView rankings={this.state.rankings} />
        <TableView />
        <RankingInspector wholeRanking={this.state.wholeRanking} ranking={selectedRanking} />
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
