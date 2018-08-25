import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';
import { Table } from 'reactstrap';

import styles from "./styles.scss";
import index from "../../index.css";
import gs from "../../config/_variables.scss"; // gs (=global style)

const _attr = {
}

class RankingsListView extends Component {
  constructor(props) {
    super(props);

    //this.renderRankingInstances = this.renderRankingInstances.bind(this);
    this.renderRankingInstance = this.renderRankingInstance.bind(this);
  }

  // renderRankingInstances(props) {
  //   const rankings = _.map(this.props.rankings, (ranking, idx)=> {
  //         return (<RankingInstance ranking={ranking} index={idx} />);
  //       });

  //   return rankings;
  // }

  renderRankingInstance(ranking) {
    // const divWrapper = new ReactFauxDOM.Element('div');

    // const svg = d3.select(divWrapper)
    //         .append('svg')
    //         .attr('class', 'svgRankingList')
    //         .attr("width", 100)
    //         .attr('height', 500);

    // let xScale = d3.scaleBand()
    //         .range([0, 100])
    //         .domain([0,1,2,3,4,5,6,7,8,9,10]);
      
    // const groupColorScale = d3.scaleOrdinal()
    //         .range([gs.groupColor1, gs.groupColor2])
    //         .domain([1, 2]);

    // const gRankings = svg
    //         .selectAll('.rankingInstance')
    //         .data(this.props.rankings)
    //         .enter().append('g')
    //         .attr('class', 'rankingInstance')
    //         .attr('transform', function(d, i) {
    //           return 'translate(0, ' + ((i+1) * 10) + ')'; 
    //         });

    // gRankings
    //   .each(function(d){
    //     var gRanking = d3.select(this);

    //     gRanking
    //       .selectAll('.instance')
    //       .data(d)
    //       .enter().append('rect')
    //       .attr('class', 'instance')
    //       .attr('x', function(e, i) {
    //         return xScale(i + 1);
    //       })
    //       .attr('y', 0)
    //       .attr('width', 8)
    //       .attr('height', 15)
    //       .style('fill', function(e) {
    //         return groupColorScale(e.group);
    //       })
    //       .style('stroke', 'white');
    //   });


            
    
    return (
      <RankingInstance ranking={ranking}></RankingInstance>
    );
  }

  render() {
    let rankingInstances = _.map(this.props.rankings, (ranking) => this.renderRankingInstance(ranking));

    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'svg_ranking_list1');

    let xScale = d3.scaleBand()
            .range([0, 100])
            .domain([0,1,2,3,4,5,6,7,8,9,10]);
      
    const groupColorScale = d3.scaleOrdinal()
            .range([gs.groupColor1, gs.groupColor2])
            .domain([1, 2]);

    const gRanking = d3.select(svg)
          .selectAll('.instance')
          .data(this.props.rankings[0])
          .enter().append('rect')
          .attr('class', 'instance')
          .attr('x', function(e, i) {
            return 15 * (i+1);
          })
          .attr('y', 0)
          .attr('width', 15)
          .attr('height', 20)
          .style('fill', function(e) {
            return groupColorScale(e.group);
          })
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

    return (
      <div className={styles.RankingsListView}>
        <div className={index.title + ' ' + styles.title }> RANKINGS </div>
        <div className={styles.addRanking}>+</div>
        <div className={styles.rankingCondition}>RANKING SVM + FEATURE 17</div>
        <Table borderless className={styles.FeatureTable}>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Ranking</th>
                    <th>SD</th>
                    <th>SP</th>
                    <th>TP</th>
                    <th>FP</th>
                </tr>
            </thead>
            <tbody className={styles.FeatureTableTbody}>
                <tr>
                    <td>R-1</td>
                    <td>{svg.toReact()}</td>
                    <th>..</th>
                    <td>89</td>
                    <td>92</td>
                    <td>92</td>
                </tr>
            </tbody>
        </Table>
      </div>
    );
  }
}

class RankingInstance extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'svg_ranking_list');

    let xScale = d3.scaleBand()
            .range([0, 100])
            .domain([0,1,2,3,4,5,6,7,8,9,10]);
      
    const groupColorScale = d3.scaleOrdinal()
            .range([gs.groupColor1, gs.groupColor2])
            .domain([1, 2]);

    const gRanking = d3.select(svg)
          .selectAll('.instance')
          .data(this.props.ranking)
          .enter().append('rect')
          .attr('class', 'instance')
          .attr('x', function(e, i) {
            return 15 * (i+1);
          })
          .attr('y', 0)
          .attr('width', 15)
          .attr('height', 20)
          .style('fill', function(e) {
            return groupColorScale(e.group);
          })
          .style('stroke', 'black')
          .style('shape-rendering', 'crispEdge')
          .style('stroke-width', 0.3);

    return (
      <div className={styles.rankingInstanceWrapper}>
        {svg.toReact()}
      </div>
    );
  }
}

export default RankingsListView;
