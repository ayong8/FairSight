import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Slider } from 'antd';
// import { BarChart } from 'react-dc';
import dc from 'dc';
import crossfilter from 'crossfilter';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class RankingView extends Component {
    constructor(props) {
      super(props);
    
      this.topk = 10;
      this.numWholeRanking;
      this.layout = {
          svgRanking: {
              width: 800,
              height: 80
          },
          rankingPlot: {
              width: 700,
              height: 70,
              margin: 10
          }
      };

      this.onSelectedRankingIntervalChange = this.onSelectedRankingIntervalChange.bind(this);
    }

    onSelectedRankingIntervalChange() {

    }

    render() {
      if ((!this.props.topk || this.props.topk.length === 0) ||
          (!this.props.data || this.props.data.length === 0)) {
        return <div />
      }

      let _self = this;

      _self.topk = this.props.topk;
      let data = this.props.data,
          instances = data.instances;
      instances = _.sortBy(instances, ['score'], ['desc']).reverse();

      // Split the data into topK and the rest
      let dataTopK = instances.slice(0, _self.topk),
          dataWholeRanking = instances.slice(_self.topk + 1);
      _self.numWholeRanking = dataWholeRanking.length;

      // Sort
      dataTopK = _.sortBy(dataTopK, ['score'], ['desc']).reverse();
      dataWholeRanking = _.sortBy(dataWholeRanking, ['score'], ['desc']).reverse();
      
      // Set up the layout
      const svgTopkRankingView = new ReactFauxDOM.Element('svg');

      svgTopkRankingView.setAttribute('width', _self.layout.svgRanking.width / 2);
      svgTopkRankingView.setAttribute('height', _self.layout.svgRanking.height);

      const xTopKRatio = _self.topk / _self.numWholeRanking + 0.1,
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

      const gTopKRanking = d3.select(svgTopkRankingView).append('g')
            .attr('class', 'g_top_k_ranking')
            .attr('transform', 'translate(' + _self.layout.rankingPlot.margin + ',' + '0)'),
            gWholeRanking = d3.select(svgTopkRankingView).append('g')
            .attr('class', 'g_whole_ranking')
            .attr('transform', 'translate(' + (_self.layout.rankingPlot.width * xTopKRatio + _self.layout.rankingPlot.margin) + ',' + '0)');

      // // setup the bar-chart with dc.js
      // let chart = dc.barChart(_self.el)
      //     .width(700)
      //     .height(100)
      //     .useViewBoxResizing(true)
      //     .margins(3)
      //     .x(xRectWholeRankingScale)
      //     .yAxis(yAxis)
      //     .dimension([1,2,3])
      //     .group([{  }]);

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

      // Place the topk bar
      gTopKRanking
        .append('circle')
        .attr('class', 'topk_bar')
        .attr('cx', (d) => xRectTopKRankingScale(_self.topk))
        .attr('cy', (d) => _self.layout.rankingPlot.height)
        .attr('r', 3)
        .style('fill', 'black')
        .style('stroke', 'none')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 1.5);
        
      gTopKRanking
        .append('line')
        .attr('class', 'topk_bar')
        .attr('x1', (d) => xRectTopKRankingScale(_self.topk))
        .attr('y1', (d) => 0)
        .attr('x2', (d) => xRectTopKRankingScale(_self.topk))
        .attr('y2', (d) => _self.layout.rankingPlot.height)
        .style('stroke', 'black')
        .style('stroke-dasharray', '3,3')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 1.5);

      const ndx               = crossfilter(data),
            rankingDimension  = ndx.dimension((d) => d.ranking),
            scores            = rankingDimension.group().reduceSum((d) => d.score),
            xRankingScale     = d3.scaleLinear().domain(_.map(data, (d) => d.ranking));

      return (
        <div className={styles.RankingView}>
          <div className={index.title}>Output</div>
          <div className={styles.outputSummary}>Accuracy: {this.props.data.stat.accuracy}</div>
          <div className={styles.rankingSummary}>
            <div className={styles.rankingWrapper}>
              <div>
                <div>Top-k ranking</div>
                {svgTopkRankingView.toReact()}
              </div>
              <div>
                <div>Selected ranking</div>
                {svgTopkRankingView.toReact()}
              </div>
            </div>
            <Slider range step={1} defaultValue={[20, 50]} onChange={this.onSelectedRankingIntervalChange} />
          </div>
          {/* <div className={styles.wholeRanking}>
            <BarChart dimension={rankingDimension} 
                      group={scores} 
                      x={xRankingScale} />
          </div> */}
        </div>
      );
    }
  }

  export default RankingView;