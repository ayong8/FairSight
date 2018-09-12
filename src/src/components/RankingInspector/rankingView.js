import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Slider, Icon } from 'antd';
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

      this.handleSelectedRankingIntervalChange = this.handleSelectedRankingIntervalChange.bind(this);
    }

    handleSelectedRankingIntervalChange(interval) {
      console.log(interval);
      this.props.onSelectedRankingIntervalChange(interval);
    }

    renderHistogram() {
      // const selectedRankingInterval = this.props.selectedRankingInterval,
      //       data = this.props.data,
      //       instances = _.sortBy([...data.instances], ['score'], ['desc']).reverse();
      // _self.topk = this.props.topk;

      // // Set up the layout
      // const svgHistogram = new ReactFauxDOM.Element('svg');

      // svgHistogram.setAttribute('width', 300);
      // svgHistogram.setAttribute('height', _self.layout.svgRanking.height);
      // svgHistogram.setAttribute('class', 'svg_top_histogram');
      // svgHistogram.style.setProperty('border', '1px dashed #003569');
      // svgHistogram.style.setProperty('margin', '5px');

      // // Violin plot for summary
      // const histoChart = d3.histogram()
      //         .domain(_self.yDistortionScale.domain())
      //         .thresholds([-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1])
      //         .value(d => d),
      //       histoChartWhole = histoChart(_.map(dataPairwiseDiffs, (d) => d.distortion)),
      //       histoChartWithinGroupPair1 = histoChart(_.map(dataWithinGroupPair1, (d) => d.distortion)),
      //       histoChartWithinGroupPair2 = histoChart(_.map(dataWithinGroupPair2, (d) => d.distortion)),
      //       histoChartBetweenGroupPair = histoChart(_.map(dataBetweenGroupPair, (d) => d.distortion)),
      //       xViolinPlotWithinGroupPair1Scale = d3.scaleLinear()
      //         .domain(d3.extent(histoChartWithinGroupPair1, (d) => d.length))
      //         .range([0, 15]),
      //       xViolinPlotWithinGroupPair2Scale = d3.scaleLinear()
      //         .domain(d3.extent(histoChartWithinGroupPair2, (d) => d.length))
      //         .range([0, 15]),
      //       xViolinPlotBetweenGroupPairScale = d3.scaleLinear()
      //         .domain(d3.extent(histoChartBetweenGroupPair, (d) => d.length))
      //         .range([0, 15]),
      //       areaWithinGroupPair1 = d3.area()
      //         .x0(d => -xViolinPlotWithinGroupPair1Scale(d.length))
      //         .x1(d => xViolinPlotWithinGroupPair1Scale(d.length))
      //         .y(d => _self.yDistortionScale(d.x0))
      //         .curve(d3.curveCatmullRom),
      //       areaWithinGroupPair2 = d3.area()
      //         .x0(d => -xViolinPlotWithinGroupPair2Scale(d.length))
      //         .x1(d => xViolinPlotWithinGroupPair2Scale(d.length))
      //         .y(d => _self.yDistortionScale(d.x0))
      //         .curve(d3.curveCatmullRom),
      //       areaBetweenGroupPair = d3.area()
      //         .x0(d => -xViolinPlotBetweenGroupPairScale(d.length))
      //         .x1(d => xViolinPlotBetweenGroupPairScale(d.length))
      //         .y(d => _self.yDistortionScale(d.x0))
      //         .curve(d3.curveCatmullRom);
    }

    render() {
      if ((!this.props.topk || this.props.topk.length === 0) ||
          (!this.props.selectedRankingInterval || this.props.selectedRankingInterval.length === 0) ||
          (!this.props.data || this.props.data.length === 0)) {
        return <div />
      }

      const _self = this;

      const selectedRankingInterval = this.props.selectedRankingInterval,
            data = this.props.data,
            instances = _.sortBy([...data.instances], ['score'], ['desc']).reverse();
      _self.topk = this.props.topk;
      
      // Split the data into Topk and the rest
      let dataTopk = instances.slice(0, _self.topk),
          dataSelectedInstances = instances.slice(_self.topk + 1);
      
      // Set up the layout
      const svgTopkRankingView = new ReactFauxDOM.Element('svg');

      svgTopkRankingView.setAttribute('width', _self.layout.svgRanking.width / 2);
      svgTopkRankingView.setAttribute('height', _self.layout.svgRanking.height);
      svgTopkRankingView.setAttribute('class', 'svg_top_ranking');
      svgTopkRankingView.style.setProperty('border', '1px dashed #003569');
      svgTopkRankingView.style.setProperty('margin', '5px');

      const xTopkThreshold = 10;

      const xRectTopkRankingScale = d3.scaleBand()
            .domain(_.map(dataTopk, (d) => d.ranking))
            .range([0, 11 * _self.topk]),
          xRectSelectedInstancesRankingScale = d3.scaleBand()
            .domain(_.map(dataSelectedInstances, (d) => d.ranking))
            .range([0, _self.layout.rankingPlot.width]),
          yRectTopkRankingScale = d3.scaleLinear()
            .domain(d3.extent(dataTopk, (d) => d.score))
            .range([0, _self.layout.rankingPlot.height]),
          yRectSelectedInstancesRankingScale = d3.scaleLinear()
            .domain(d3.extent(data, (d) => d.score))
            .range([_self.layout.rankingPlot.height, 0]),
          groupColorScale = d3.scaleOrdinal()
            .range([gs.groupColor1, gs.groupColor2])
            .domain([1, 2]);

      const gTopkRanking = d3.select(svgTopkRankingView).append('g')
            .attr('class', 'g_top_k_ranking')
            .attr('transform', 'translate(' + _self.layout.rankingPlot.margin + ',' + '0)'),
            gWholeRanking = d3.select(svgTopkRankingView).append('g')
            .attr('class', 'g_whole_ranking')
            .attr('transform', 'translate(' + (_self.layout.rankingPlot.width + _self.layout.rankingPlot.margin) + ',' + '0)');

      gTopkRanking.selectAll('.rect_topk')
        .data(dataTopk)
        .enter().append('rect')
        .attr('class', (d) => 'rect_topk rect_topk_' + d.ranking)
        .attr('x', (d) => xRectTopkRankingScale(d.ranking))
        .attr('y', (d) => _self.layout.rankingPlot.height - yRectTopkRankingScale(d.score))
        .attr('width', 10)
        .attr('height', (d) => yRectTopkRankingScale(d.score))
        .style('fill', (d) => groupColorScale(d.group))
        .style('stroke', 'white')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 1.5);

      gWholeRanking.selectAll('.rect_whole_ranking')
        .data(dataSelectedInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_whole_ranking rect_whole_ranking_' + d.ranking)
        .attr('x', (d) => xRectSelectedInstancesRankingScale(d.ranking))
        .attr('y', (d) => _self.layout.rankingPlot.height - yRectTopkRankingScale(d.score))
        .attr('width', xRectSelectedInstancesRankingScale.bandwidth())
        .attr('height', (d) => yRectTopkRankingScale(d.score))
        .style('fill', (d) => groupColorScale(d.group))
        .style('stroke', 'white')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 1.5);

      // define the line
      let wholeRankingLine = d3.line()
        .x((d) => xRectSelectedInstancesRankingScale(d.ranking))
        .y((d) => _self.layout.rankingPlot.height - yRectTopkRankingScale(d.score)),
          wholeRankingArea = d3.area()
        .x(function(d) { return xRectSelectedInstancesRankingScale(d.ranking); })
        .y0(_self.layout.rankingPlot.height)
        .y1(function(d) { return _self.layout.rankingPlot.height - yRectTopkRankingScale(d.score); });

      gWholeRanking.append("path")
        .datum(dataSelectedInstances)
        .attr("class", "whole_ranking_line")
        .attr("d", wholeRankingLine)
        .style('stroke', '#294b5b')
        .style('stroke-dasharray', '3,3')
        .style('fill', 'none');
          
      // add the area
      gWholeRanking.append("path")
        .datum(dataSelectedInstances)
        .attr("class", "whole_ranking_area")
        .attr("d", wholeRankingArea)
        .style('fill', 'lightgray')
        .style('opacity', 0.5);

      const ndx               = crossfilter(data),
            rankingDimension  = ndx.dimension((d) => d.ranking),
            scores            = rankingDimension.group().reduceSum((d) => d.score),
            xRankingScale     = d3.scaleLinear().domain(_.map(data, (d) => d.ranking));

      // load your general data
      const chartData = _.map(instances, (d) => {
            return { 
              ranking: d.ranking, 
              score: d.score 
            }});

      const width = 700,
        height = 300,
        margins = {left: 100, right: 100, top: 50, bottom: 50},
        // chart series,
        // field: is what field your data want to be selected
        // name: the name of the field that display in legend
        // color: what color is the line
        chartSeries = [
          {
            field: 'total',
            name: 'Total',
            color: '#ff7f0e'
          }
        ],
        // your x accessor
        x = function(d) {
          return d.ranking;
        },
        xScale = 'ordinal',
        // your brush height
        brushHeight = 100;

      return (
        <div className={styles.RankingView}>
          <div className={styles.rankingViewTitleWrapper}>
            <Icon className={styles.step4} type="check-circle" theme="filled" /> &nbsp;
            <div className={styles.rankingViewTitle + ' ' + index.title}>Output</div>
          </div>
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
            <Slider range step={1} defaultValue={[0, 50]} onChange={this.handleSelectedRankingIntervalChange} />
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