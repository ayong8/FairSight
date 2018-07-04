import React, { Component } from "react";
import styles from "./styles.scss";
import Footer from "components/Footer";
import Generator from 'components/Generator';
import RankingInspector from 'components/RankingInspector';
import RankingsListView from 'components/RankingsListView';
import TableView from 'components/TableView';
import { Button } from 'reactstrap';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataset: {},
      rankings: [
        {
          1: { ranking: 1, score: 90 },
          2: { ranking: 2, score: 88 },
          3: { ranking: 3, score: 85 },
          4: { ranking: 4, score: 82 },
          5: { ranking: 5, score: 80 },
          6: { ranking: 6, score: 78 },
          7: { ranking: 7, score: 75 },
          8: { ranking: 8, score: 70 }
        },
        {
          1: { ranking: 1, score: 90 },
          2: { ranking: 2, score: 88 },
          3: { ranking: 3, score: 85 },
          4: { ranking: 4, score: 82 },
          5: { ranking: 5, score: 80 },
          6: { ranking: 6, score: 78 },
          7: { ranking: 7, score: 75 },
          8: { ranking: 8, score: 70 }
        }
      ]
    };
  }

  render() {
    // if (this.state.loadError) {
    //   return <div>couldn't load file</div>;
    // }
    // if (!this.state.data) {
    //   return <div />;
    // }

    return (
      <div className={styles.App}>
        <div className={styles.titleBar}>
          <span>FairSight</span>
        </div>
        <Generator dataset='german.csv' />
        <RankingsListView rankings={this.state.rankings} />
        <TableView />
        <RankingInspector />
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
