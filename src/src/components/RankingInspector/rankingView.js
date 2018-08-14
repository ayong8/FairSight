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
    
      this.numTopK = 10;
      this.numWholeRanking;
      this.layout = {
          svgRanking: {
              width: 800,
              height: 100
          },
          rankingPlot: {
              width: 700,
              height: 70,
              margin: 10
          }
      };
    }
    render() {
        let _self = this;

        let data = this.props.output;
        data = _.sortBy(data, ['score'], ['desc']).reverse();

        // Split the data into topK and the rest
        let dataTopK = data.slice(0, _self.numTopK),
            dataWholeRanking = data.slice(_self.numTopK + 1);
        _self.numWholeRanking = dataWholeRanking.length;

        console.log('data in rankingview: ', _.map(dataTopK, (d) => d.score), _.map(dataWholeRanking, (d) => d.score));

        // Sort
        dataTopK = _.sortBy(dataTopK, ['score'], ['desc']).reverse();
        dataWholeRanking = _.sortBy(dataWholeRanking, ['score'], ['desc']).reverse();
  
        // Set up the layout
        const svgRankingView = new ReactFauxDOM.Element('svg');

        svgRankingView.setAttribute('width', _self.layout.svgRanking.width);
        svgRankingView.setAttribute('height', _self.layout.svgRanking.height);

        const xTopKRatio = _self.numTopK / _self.numWholeRanking + 0.1,
              xWholeRankingRatio = 1 - xTopKRatio;

        const xRectTopKRankingScale = d3.scaleBand()
                    .domain(_.map(dataTopK, (d) => d.ranking))
                    .range([0, _self.layout.rankingPlot.width * xTopKRatio]),
            xRectWholeRankingScale = d3.scaleBand()
                    .domain(_.map(dataWholeRanking, (d) => d.ranking))
                    .range([0, _self.layout.rankingPlot.width * xWholeRankingRatio]),
            yRectTopKRankingScale = d3.scaleLinear()
                    .domain(d3.extent(data, (d) => d.score))
                    .range([0, _self.layout.rankingPlot.height]),
            yRectWholeRankingScale = d3.scaleLinear()
                    .domain(d3.extent(data, (d) => d.score))
                    .range([_self.layout.rankingPlot.height, 0]),
            groupColorScale = d3.scaleOrdinal()
                    .range([gs.groupColor1, gs.groupColor2])
                    .domain([1, 2]);

        const gTopKRanking = d3.select(svgRankingView).append('g')
                    .attr('class', 'g_top_k_ranking')
                    .attr('transform', 'translate(' + _self.layout.rankingPlot.margin + ',' + '0)'),
              gWholeRanking = d3.select(svgRankingView).append('g')
                    .attr('class', 'g_whole_ranking')
                    .attr('transform', 'translate(' + (_self.layout.rankingPlot.width * xTopKRatio + _self.layout.rankingPlot.margin) + ',' + '0)');

        gTopKRanking.selectAll('.rect_topk')
                .data(dataTopK)
                .enter().append('rect')
                .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
                .attr('x', (d) => xRectTopKRankingScale(d.ranking))
                .attr('y', (d) => _self.layout.rankingPlot.height - yRectTopKRankingScale(d.score))
                .attr('width', xRectTopKRankingScale.bandwidth())
                .attr('height', (d) => yRectTopKRankingScale(d.score))
                .style('fill', (d) => groupColorScale(d.group))
                .style('stroke', 'white')
                .style('shape-rendering', 'crispEdge')
                .style('stroke-width', 1.5);

        gWholeRanking.selectAll('.rect_whole_ranking')
                .data(dataWholeRanking)
                .enter().append('rect')
                .attr('class', (d) => 'rect_whole_ranking rect_whole_ranking_' + d.ranking)
                .attr('x', (d) => xRectWholeRankingScale(d.ranking))
                .attr('y', (d) => _self.layout.rankingPlot.height - yRectTopKRankingScale(d.score))
                .attr('width', xRectWholeRankingScale.bandwidth())
                .attr('height', (d) => yRectTopKRankingScale(d.score))
                .style('fill', (d) => groupColorScale(d.group))
                .style('stroke', 'white')
                .style('shape-rendering', 'crispEdge')
                .style('stroke-width', 1.5);

        // define the line
        let wholeRankingLine = d3.line()
                .x((d) => xRectWholeRankingScale(d.ranking))
                .y((d) => _self.layout.rankingPlot.height - yRectTopKRankingScale(d.score)),
            wholeRankingArea = d3.area()
                .x(function(d) { return xRectWholeRankingScale(d.ranking); })
                .y0(_self.layout.rankingPlot.height)
                .y1(function(d) { return _self.layout.rankingPlot.height - yRectTopKRankingScale(d.score); }),
            selectedArea = gTopKRanking.append('rect')
                .attr('class', 'selected_area')
                .attr('x', xRectTopKRankingScale(1))
                .attr('y', 0)
                .attr('width', xRectTopKRankingScale(7))
                .attr('height', _self.layout.rankingPlot.height)
                .style('fill', '#96cfea')
                .style('stroke', '#294b5b')
                .style('stroke-dasharray', '3,3')
                .style('fill-opacity', 0.4);

        gWholeRanking.append("path")
                .datum(dataWholeRanking)
                .attr("class", "whole_ranking_line")
                .attr("d", wholeRankingLine)
                .style('stroke', '#294b5b')
                .style('stroke-dasharray', '3,3')
                .style('fill', 'none');
      
        // add the area
        gWholeRanking.append("path")
                .datum(dataWholeRanking)
                .attr("class", "whole_ranking_area")
                .attr("d", wholeRankingArea)
                .style('fill', 'lightgray')
                .style('opacity', 0.5);

      return (
        <div className={styles.RankingView}>
          <div className={index.title}>Ranking</div>
          {svgRankingView.toReact()}
        </div>
      );
    }
  }

  export default RankingView;