import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import gs from "../../config/_variables.scss"; // gs (=global style)

class RankingInspector extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var data = [1,2,3,4,5];

    return (
      <div className={styles.RankingInspector}>
        <div className={styles.title}>Individual Fairness</div>
        <div className={styles.title}>Ranking Output</div>
        <div className={styles.title}>Group Fairness</div>
        <IndividualFairnessView ranking={this.props.ranking} className={styles.IndividualFairnessView} />
        <RankingView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.RankingView} />
        <GroupFairnessView ranking={this.props.ranking} wholeRanking={this.props.wholeRanking} className={styles.FairnessView} />
      </div>
    );
  }
}

class IndividualFairnessView extends Component {
  constructor(props) {
    super(props);


  }

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
    // var circles = this.props.ranking.map(d => {
    //         return (
    //           <circle cx='3' cy='4' r={d}></circle>
    //         );
    //       });

    return (
      <div>
        <svg>
        </svg>
      </div>
    );
  }
}

/* props: this.props.ranking
  => selected ranking data
*/
class RankingView extends Component {
  constructor(props) {
    super(props);
  }


  render() {
    console.log("gs: ", gs);
    const rankingData = this.props.ranking,
          wholeRankingData = this.props.wholeRanking;

    // Set up the layout
    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    var rectGlobalRankingScale = d3.scaleLinear()
                .range([15, 50])
                .domain(d3.extent(wholeRankingData, (d) => d.score));
    
    var rectTopKRankingScale = d3.scaleLinear()
                .range([15, 50])
                .domain(d3.extent(rankingData, (d) => d.score));

    var groupColorScale = d3.scaleOrdinal()
                .range([gs.groupColor1, gs.groupColor2])
                .domain([1, 2]);

    const gGlobalRanking = d3.select(svg).append('g')
                        .attr('class', 'g_global_ranking')
                        .attr('transform', 'translate(0,0)');
    
    const gTopKRanking = d3.select(svg).append('g')
                        .attr('class', 'g_top_k_ranking')
                        .attr('transform', 'translate(100,0)');

    console.log('g and data: ', gGlobalRanking, rankingData);

    gGlobalRanking.selectAll('.rect_global')
            .data(wholeRankingData)
            .enter().append('rect')
            .attr('class', function(d, i){
                return 'rect_global_' + i;
            })
            .attr('x', 0)
            .attr('y', function(d, i){
                return 8 * i;
            })
            .attr('width', function(d){
                return rectGlobalRankingScale(d.score);
            })
            .attr('height', 8)
            .style('fill', function(d){
                return groupColorScale(d.group);
            })
            .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style('shape-rendering', 'crispEdges');

    gTopKRanking.selectAll('.rect_global')
            .data(rankingData)
            .enter().append('rect')
            .attr('class', function(d, i){
                return 'rect_global_' + i;
            })
            .attr('x', function(d) {
              return 100 - rectTopKRankingScale(d.score);
            })
            .attr('y', function(d, i){
                return 20 * i;
            })
            .attr('width', function(d){
                return 100 - rectTopKRankingScale(d.score);
            })
            .attr('height', 20)
            .style('fill', function(d){
                return groupColorScale(d.group);
            })
            .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style('shape-rendering', 'crispEdges');

    
    return (
      <div className={styles.RankingView}>
      {svg.toReact()}
      </div>
    );
  }
}

class GroupFairnessView extends Component {
  render() {
    const wholeRankingData = this.props.wholeRanking;

    // Set up the layout
    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    var rectGlobalRankingScale = d3.scaleLinear()
                .range([15, 50])
                .domain(d3.extent(wholeRankingData, (d) => d.score));

    var bins = d3.histogram()
          .domain(rectGlobalRankingScale.domain())
          .thresholds(rectGlobalRankingScale.ticks(20))
          (_.map(wholeRankingData, (d) => d.score));

    // var bar = svg.selectAll(".bar")
    //     .data(data)
    //     .enter().append("g")
    //     .attr("class", "bar")
    //     .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    return (
      <div className={styles.GroupFairnessView}>

      </div>
    );
  }
}

export default RankingInspector;
