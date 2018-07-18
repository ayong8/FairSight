import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class RankingView extends Component {
    constructor(props) {
      super(props);
    }
    render() {
      const rankingData = this.props.ranking,
            wholeRankingData = this.props.wholeRanking;
  
      // Set up the layout
      const svgRankingView = new ReactFauxDOM.Element('svg');
  
      svgRankingView.setAttribute('width', '50%');
      svgRankingView.setAttribute('height', '100%');
  
      var rectGlobalRankingScale = d3.scaleLinear()
                  .range([0, 125])
                  .domain(d3.extent(wholeRankingData, (d) => d.score));
      
      var rectTopKRankingScale = d3.scaleLinear()
                  .range([125, 0])
                  .domain(d3.extent(rankingData, (d) => d.score));
  
      var groupColorScale = d3.scaleOrdinal()
                  .range([gs.groupColor1, gs.groupColor2])
                  .domain([1, 2]);
  
      const gGlobalRanking = d3.select(svgRankingView).append('g')
                          .attr('class', 'g_global_ranking')
                          .attr('transform', 'translate(10,150)');
      
      const gTopKRanking = d3.select(svgRankingView).append('g')
                          .attr('class', 'g_top_k_ranking')
                          .attr('transform', 'translate(10,0)');
  
      // gGlobalRanking.selectAll('.rect_global')
      //         .data(wholeRankingData)
      //         .enter().append('rect')
      //         .attr('class', function(d, i){
      //             return 'rect_global_' + i;
      //         })
      //         .attr('x', function(d, i){
      //             return (625 / wholeRankingData.length) * i;
      //         })
      //         .attr('y', function(d){
      //             return 45 + rectGlobalRankingScale(d.score);
      //         })
      //         .attr('width', 625 / wholeRankingData.length)
      //         .attr('height', function(d) {
      //             return 80 - rectGlobalRankingScale(d.score);
      //         })
      //         .style('fill', function(d){
      //             return groupColorScale(d.group);
      //         })
      //         .style('stroke', 'white')
      //         .style('stroke-width', 2)
      //         .style('shape-rendering', 'crispEdges');


      gTopKRanking.selectAll('.rect_topk')
              .data(_.sortBy(wholeRankingData.slice(0, 10), ['score'], ['asc']).reverse())
              .enter().append('rect')
              .attr('class', function(d, i){
                  return 'rect_topk_' + i;
              })
              .attr('x', 0)
              .attr('y', function(d, i){
                  return 15 * i;
              })
              .attr('width', function(d){
                  return rectGlobalRankingScale(d.score);
              })
              .attr('height', 15)
              .style('fill', function(d){
                  return groupColorScale(d.group);
              })
              .style('stroke', 'white')
              .style('stroke-width', 1)
              .style('shape-rendering', 'crispEdges');

      gGlobalRanking.selectAll('.rect_global')
              .data(_.sortBy(wholeRankingData, ['score'], ['asc']).reverse())
              .enter().append('rect')
              .attr('class', function(d, i){
                  return 'rect_global_' + i;
              })
              .attr('x', 0)
              .attr('y', function(d, i){
                  return 5 * i;
              })
              .attr('width', function(d){
                  return rectGlobalRankingScale(d.score) * 0.5;
              })
              .attr('height', 5)
              .style('fill', function(d){
                  return groupColorScale(d.group);
              })
              .style('stroke', 'white')
              .style('stroke-width', 1)
              .style('shape-rendering', 'crispEdges');
  
    //   gTopKRanking.selectAll('.rect_global')
    //           .data(rankingData)
    //           .enter().append('rect')
    //           .attr('class', function(d, i){
    //               return 'rect_global_' + i;
    //           })
    //           .attr('x', function(d) {
    //             return 100 - rectTopKRankingScale(d.score);
    //           })
    //           .attr('y', function(d, i){
    //               return 20 * i;
    //           })
    //           .attr('width', function(d){
    //               return rectTopKRankingScale(d.score);
    //           })
    //           .attr('height', 20)
    //           .style('fill', function(d){
    //               return groupColorScale(d.group);
    //           })
    //           .style('stroke', 'white')
    //           .style('stroke-width', 1)
    //           .style('shape-rendering', 'crispEdges');
  
      
      return (
        <div className={styles.RankingView}>
          <div className={index.title}>Ranking</div>
          {svgRankingView.toReact()}
        </div>
      );
    }
  }

  export default RankingView;