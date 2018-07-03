import React, { Component } from "react";
import styles from "./styles.scss";

class RankingsListView extends Component {
  render() {
    return (
      <div className={styles.RankingsListView}>
        <div className={styles.titleBar}>
          RANKINGS
        </div>
      </div>
    );
  }
}

export default RankingsListView;
