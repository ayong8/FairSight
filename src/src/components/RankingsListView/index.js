import React, { Component } from "react";
import _ from 'lodash';
import styles from "./styles.scss";

class RankingsListView extends Component {
  constructor(props) {
    super(props);

    this.renderRankingInstances = this.renderRankingInstances.bind(this);
  }

  renderRankingInstances(props) {
    console.log("this.props: ", this.props);
    const rankings = _.map(this.props.rankings, (ranking, idx)=> {
          console.log("In renderRankingInstance: ", ranking);
          return (<RankingInstance ranking={ranking} index={idx} />);
        });

    return rankings;
  }

  render() {
    return (
      <div className={styles.RankingsListView}>
        <div className={styles.titleBar}> RANKINGS </div>
        <div className={styles.rankingList}>
          <svg className={styles.svgRankingList}>
            {this.renderRankingInstances(this.props)}
          </svg>
        </div>
      </div>
    );
  }
}

class RankingInstance extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <rect x="10" y={(this.props.index + 1) * 20} width="60" height="10"></rect>
    );
  }
}

export default RankingsListView;
