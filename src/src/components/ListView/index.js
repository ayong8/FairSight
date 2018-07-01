import React, { Component } from "react";
import styles from "./styles.scss";

class ListView extends Component {
  render() {
    return (
      <div className={styles.ListView}>
        <div className={styles.titleBar}>
          RANKINGS
        </div>
      </div>
    );
  }
}

export default ListView;
