import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';
import styles from "./styles.scss";
import gs from "../../config/_variables.scss"; // gs (=global style)

const _attr = {
}

class RankingsListView extends Component {
  constructor(props) {
    super(props);

    this.renderRankingInstances = this.renderRankingInstances.bind(this);
    this.renderRankingListGraph = this.renderRankingListGraph.bind(this);
  }

  renderRankingInstances(props) {

    console.log("this.props: ", this.props);
    const rankings = _.map(this.props.rankings, (ranking, idx)=> {
          console.log("In renderRankingInstance: ", ranking);
          return (<RankingInstance ranking={ranking} index={idx} />);
        });

    return rankings;
  }

  renderRankingListGraph() {
    const divWrapper = new ReactFauxDOM.Element('div');

    const svg = d3.select(divWrapper)
            .append('svg')
            .attr('class', 'svgRankingList')
            .attr("width", 100)
            .attr('height', 500);

    let xScale = d3.scaleBand()
            .range([0, 100])
            .domain([0,1,2,3,4,5,6,7,8,9,10]);

    const gRankings = svg
            .selectAll('.rankingInstance')
            .data(this.props.rankings)
            .enter().append('g')
            .attr('class', 'rankingInstance')
            .attr('transform', function(d, i) {
              return 'translate(0, ' + ((i+1) * 10) + ')'; 
            });

    gRankings
      .each(function(d){
        console.log('d for each ranking: ', d);
        var gRanking = d3.select(this);

        gRanking
          .selectAll('.instance')
          .data(d)
          .enter().append('rect')
          .attr('class', 'instance')
          .attr('x', function(e, i) {
            console.log(e, i);
            console.log(xScale(i + 1));
            return xScale(i + 1);
          })
          .attr('y', 0)
          .attr('width', 10)
          .attr('height', 10);
      });
            
    
    return divWrapper.toReact();
  }

  render() {
    return (
      <div className={styles.RankingsListView}>
        <div className={styles.titleBar}> RANKINGS </div>
        {this.renderRankingListGraph()}
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
