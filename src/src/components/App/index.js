import React, { Component } from "react";
import styles from "./styles.scss";
import Footer from "components/Footer";
import Generator from 'components/Generator';
import ListView from 'components/ListView';
import RankingView from 'components/RankingView';
import TableView from 'components/TableView';
import { Button } from 'reactstrap';

class App extends Component {
  // constructor(props) {
  //   super(props);
  //   this.state = {};
  // }

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
        <div className={styles.mainViewWrapper}>
          <ListView />
        </div>
        <div className={styles.tableRankingViewWrapper}>
          <RankingView />
          <TableView />
        </div>
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
