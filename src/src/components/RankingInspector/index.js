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

  render() {
    // var circles = d3.selectAll(".circle")
    //               .data(this.props.data)
    //               .enter().append('circle')
    //               .attr("cx", 3)
    //               .attr("cy", 3)
    //               .attr("r", (d) => {
    //                 return d;
    //               })
    //               .style("stroke", "black");
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
