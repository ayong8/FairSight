import React, { Component } from "react";
import * as d3 from 'd3';
import styles from "./styles.scss";

class RankingInspector extends Component {
  render() {
    var data = [1,2,3,4,5];

    return (
      <div className={styles.RankingInspector}>
        <div className={styles.title}>Individual Fairness</div>
        <div className={styles.title}>Ranking Output</div>
        <div className={styles.title}>Group Fairness</div>
        <IndividualFairnessView data={data} className={styles.IndividualFairnessView} />
        <RankingView className={styles.RankingView} />
        <GroupFairnessView className={styles.FairnessView} />
      </div>
    );
  }
}

class IndividualFairnessView extends Component {
  constructor(props) {
    super(props);
  }

  ddd = 'dd';

  componentWillMount() {
    this.calculateDistortions();
  }

  // Plot the coordinate difference between observed(feature) and decision(ranking) space
  calculateDistortions() {
    //this.props.rankings
    // x: observed space difference, y: decision space difference
    const distortionMockup = [ 
              {x: 1, y: 2},
              {x: 2, y: 1.4},
              {x: 5, y: 4},
              {x: 6, y: 6},
              {x: 8, y: 8.8},
              {x: 10, y: 14},
              {x: 13, y: 8},
              {x: 15, y: 13},
              {x: 18, y: 17},
              {x: 20, y: 22}
            ];
  }

  render() {

    console.log(d3);
    console.log(this.props.data);

    var circles = this.props.data.map(d => {
            return (
              <circle cx='3' cy='4' r={d}></circle>
            );
          });

    console.log(circles);

    return (
      <div>
        <svg>
          {circles}
        </svg>
      </div>
    );
  }
}

class RankingView extends Component {
  render() {
    return (
      <div>
      </div>
    );
  }
}

class GroupFairnessView extends Component {
  render() {
    return (
      <div>
      </div>
    );
  }
}

export default RankingInspector;
