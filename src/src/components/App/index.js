import React, { Component } from "react";
import styles from "./styles.scss";
import Footer from "components/Footer";
import Generator from 'components/Generator';
import ListView from 'components/ListView';
import RankingView from 'components/RankingView';
import TableView from 'components/TableView';

class App extends Component {
  render() {
    return (
      <div className={styles.App}>
        <Generator />
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
}

export default App;
