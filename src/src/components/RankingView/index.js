import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Button } from 'reactstrap';
import { Slider, Icon, InputNumber, Tag, Tooltip } from 'antd';
import d3tooltip from 'd3-tooltip';
import regression from 'regression';
import { BeatLoader } from 'react-spinners';

import UtilityView from '../UtilityView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import FairnessBar from '../FairnessBar';
import UtilityBar from '../UtilityBar';

const tooltip = d3tooltip(d3);

class RankingView extends Component {
    constructor(props) {
      super(props);
    
      this.groupColorScale;
      this.intervalTo;

      // For summary plot
      this.svgPlot;
      this.xObservedScale;
      this.yDistortionScale;
      this.xGroupSkewScale;
      this.yGroupSkewScale;
      this.pairColorScale;
      this.layout = {
          wholeRankingPlot: {
            width: 900,
            height: 300,
            margin: 30,
            svg: {
              width: 900,
              height: 120
            },
            plot: {
              width: 750,
              height: 90,
              margin: 10,
              marginTop: 40,
              marginBottom: 30,
              marginBtn: 10
            }
          },
          svgPlot: {
            width: 750, // 90% of whole layout
            height: 150 // 100% of whole layout
          },
          outputSpaceView: {
            width: 450,
            height: 60,
            margin: 10,
            bw: 7 // bar width
          },
          selectedIntervalView: {
            width: 450,
            height: 40,
            margin: 10,
            bw: 7 // bar width
          },
          plot: {
            width: 350,
            height: 150,
            padding: 10
          },
          groupSkew: {
            width: 70,
            height: 250
          }
      };

      this.state = {
        topk: 30,
        selectedRankingInterval: {
          from: 0,
          to: 50
        },
        precisionK: 0,
        statParityK: 0,
        precisionKData: [],
        statParityKData: [],
        isMouseOveredGroupFairness: false
      }

      this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
      this.handleIntervalChange = this.handleIntervalChange.bind(this);
      this.handleFilterRunning = this.handleFilterRunning.bind(this);
      this.handleMouseOverGroupFairness = this.handleMouseOverGroupFairness.bind(this);
    }

    componentDidMount() {
      console.log('componentdidmount in ranking view');
      const { topk } = this.state,
            { data } = this.props,
            { instances } = data;

      // let precisionKData = [ [ 1, instances.map((d) => d.target)[0] ] ],
      //     statParityKData = [ [ 1, instances.map((d) => d.group)[0]  ] ];
      let precisionKData = [],
          statParityKData = [];
          
      // Calculate precisionK (within-utility)
      let sumNumTrue = 0;
      instances.map((d) => d.target)
          .forEach((d, i) => {
            const isTrue = (d === 0) ? 1 : 0;
            const ranking = i + 1,
                  length = i + 1;

            sumNumTrue += isTrue;

            const precisionK = sumNumTrue / length;

            precisionKData.push([ ranking, precisionK]);
          });

      let sumNumProtectedGroup = 0;
      instances.map((d) => d.group)
          .forEach((d, i) => {
            const isProtectedGroup = (d === 1) ? 1 : 0;
            const ranking = i + 1,
                  length = i + 1;

            sumNumProtectedGroup += isProtectedGroup;

            const statParityK = sumNumProtectedGroup / length;

            statParityKData.push([ ranking, statParityK]);
          });

      this.setState({
        topk: topk,
        statParityKData: statParityKData,
        precisionKData: precisionKData
      });
    }

    componentWillUpdate() {
      const { isMouseOveredGroupFairness } = this.state;

      // if (isMouseOveredGroupFairness === false) {
      //   d3.selectAll('.rect_whole_ranking_topk')
      //     .style('stroke-width', 2);
      // } else {
      //   d3.selectAll('.rect_whole_ranking_topk')
      //     .style('stroke-width', 0.5);
      // }
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //   const shouldRunModel = nextProps.data.shouldRunModel;
      
    //   return shouldRunModel;
    // }

    handleSelectedTopk(topk) {
      const { data } = this.props,
            { instances } = data;

      let precisionKData = [ [ 1, instances.map((d) => d.target)[0] ] ],
          statParityKData = [ [ 1, instances.map((d) => d.group)[0]  ] ];
      
      instances.map((d) => d.target)
          .reduce((acc, curr, currIdx) => {
            const ranking = currIdx + 1,
                  length = currIdx + 1;

            precisionKData.push([ ranking, (length - (acc + curr)) / length]);
            return acc + curr;
          });

      instances.map((d) => d.group)
          .reduce((acc, curr, currIdx) => {
            const ranking = currIdx + 1,
                  length = currIdx + 1;

            const groupRatio = (acc + curr) / (length - (acc + curr)),
                  statParityK = groupRatio < 0 ? 0 : groupRatio; // If the ratio is infinity, treat as 0

            statParityKData.push([ ranking, statParityK]);
            return acc + curr;
          });

      this.setState({
        topk: topk,
        statParityKData: statParityKData,
        precisionKData: precisionKData,
        statParityK: statParityKData[statParityKData.length-1],
        precisionK: precisionKData[precisionKData.length-1]
      });
    }

    handleIntervalChange(intervalTo) {
      this.setState({
        selectedRankingInterval: {
          from: 0,
          to: intervalTo
        }
      });
    }

    handleFilterRunning() {
      const { topk, selectedRankingInterval } = this.state,
            { from, to } = selectedRankingInterval;

      this.props.onSelectedTopk(topk); // Send up the state 'topk' to state
      this.props.onSelectedInterval(to);
      this.props.onRunningFilter(topk);
    }

    handleMouseOverGroupFairness() {
      this.setState({
        isMouseOveredGroupFairness: !this.state.isMouseOveredGroupFairness
      });
    }

    renderWholeRankingPlot() {
      const _self = this;

      const { data, n } = this.props;
      const { topk, selectedRankingInterval, isMouseOveredGroupFairness } = this.state;
      const { to } = selectedRankingInterval;
      const { instances } = data,
            topkInstances = instances.filter((d) => d.ranking <= topk),
            selectedNonTopkInstances = instances.filter((d) => d.ranking > topk && d.ranking <= to),
            nonTopkInstances = instances.filter((d) => d.ranking > to),
            // only ten or less non-topk instances are rendered
            renderedNonTopkInstances = nonTopkInstances.slice(0, Math.max(selectedNonTopkInstances.length, 10));
      
      const { precisionKData, statParityKData } = this.state;

      const svg = new ReactFauxDOM.Element('svg');

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', _self.layout.wholeRankingPlot.svg.height);
      svg.setAttribute('0 0 200 200');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('class', 'svg_whole_ranking');
  
      const rectInterval = 10,
            rectWidth = 8,
            rectHeight = 30,
            topkPlotWidth = rectInterval * topk, // topk and non-topk plot have the same length
            selectedNonTopkPlotWidth = rectInterval * (to - topk + 1),
            renderedNonTopkWidth = rectInterval * renderedNonTopkInstances.length;
  
      const topkRankingScale = d3.scaleBand()
              .domain(d3.range(1, topk+1))
              .range([0, topkPlotWidth]),
            selectedNonTopkRankingScale = d3.scaleBand()
              .domain(d3.range(topk+1, to+1))
              .range([0, selectedNonTopkPlotWidth]),
            renderedNonTopkRankingScale = d3.scaleBand()
              .domain(d3.range(to+1, to+renderedNonTopkInstances.length+1))
              .range([0, renderedNonTopkWidth]),
            groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([0, 1]),
            precisionKScale = d3.scaleLinear()
              .range([0, rectHeight])
              .domain([1, 0]),
            statParityScale = d3.scaleLinear()
              .range([0, rectHeight])
              .domain([1, 0]);

      const topkTickValues = [1, ...d3.range(5, topk, 5), topk],
            selectedNonTopkTickValues = [topk+1, ...d3.range(topk+1 + ((topk+1) % 5), to, 5), to];
  
      const xTopkAxis = d3.select(svg)
              .append('g')
              .attr('class', 'g_x_whole_ranking_topk_axis')
              .attr('transform', 'translate(' + _self.layout.wholeRankingPlot.plot.margin + ',' + (_self.layout.wholeRankingPlot.plot.marginTop + rectHeight + 10) + ')')
              .call(d3.axisBottom(topkRankingScale).tickValues(topkTickValues).tickSizeOuter(0)),
            xSelectedNonTopkAxis = d3.select(svg)
              .append('g')
              .attr('class', 'g_x_whole_ranking_selected_non_topk_axis')
              .attr('transform', 'translate(' + (_self.layout.wholeRankingPlot.plot.margin + topkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn) + ',' + (_self.layout.wholeRankingPlot.plot.marginTop + rectHeight + 10) + ')')
              .call(d3.axisBottom(selectedNonTopkRankingScale).tickSizeOuter(0).tickValues(d3.range(topk+1, to, 5)));
            // xNonTopkAxis = d3.select(svg)
            //   .append('g')
            //   .attr('class', 'g_x_whole_ranking_non_topk_axis')
            //   .attr('transform', 'translate(' + (_self.layout.wholeRankingPlot.plot.margin + topkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn + selectedNonTopkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn) + ',' + (_self.layout.wholeRankingPlot.plot.marginTop + rectHeight + 10) + ')')
            //   .call(d3.axisBottom(nonTopkRankingScale).tickValues(d3.range(topk+1, n, 10)));

      const rectTopkRegion = d3.select(svg).append('rect')
              .attr('class', 'rect_topk_region')
              .attr('x', _self.layout.wholeRankingPlot.plot.margin)
              .attr('y', _self.layout.wholeRankingPlot.svg.height - _self.layout.wholeRankingPlot.plot.marginBottom - 17.5)
              .attr('width', _self.layout.wholeRankingPlot.plot.margin + topkPlotWidth - _self.layout.wholeRankingPlot.plot.marginBtn)
              .attr('height', 5)
              .style('fill', gs.topkColor),
            rectNonTopkRegion = d3.select(svg).append('rect')
              .attr('class', 'rect_non_topk_region')
              .attr('x', _self.layout.wholeRankingPlot.plot.margin + topkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn)
              .attr('y', _self.layout.wholeRankingPlot.svg.height - _self.layout.wholeRankingPlot.plot.marginBottom - 17.5)
              .attr('width', selectedNonTopkRankingScale(to) - selectedNonTopkRankingScale(topk + 1))
              .attr('height', 5)
              .style('fill', gs.nonTopkColor);
  
      const gTopkRanking = d3.select(svg).append('g')
              .attr('class', 'g_topk_whole_ranking')
              .attr('transform', 'translate(' + _self.layout.wholeRankingPlot.plot.margin + ',' + _self.layout.wholeRankingPlot.plot.marginTop + ')'),
            gSelectedNonTopkRanking = d3.select(svg).append('g')
              .attr('class', 'g_selected_non_topk_whole_ranking')
              .attr('transform', 'translate(' + (_self.layout.wholeRankingPlot.plot.margin + topkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn) + ',' + _self.layout.wholeRankingPlot.plot.marginTop + ')'),
            gNonTopkRanking = d3.select(svg).append('g')
              .attr('class', 'g_non_topk_whole_ranking')
              .attr('transform', 'translate(' + (_self.layout.wholeRankingPlot.plot.margin + topkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn + selectedNonTopkPlotWidth + _self.layout.wholeRankingPlot.plot.marginBtn) + ',' + _self.layout.wholeRankingPlot.plot.marginTop + ')');

      const diagonalPattern = d3.select(svg)
              .append('defs')
              .append('pattern')
                .attr('id', 'diagonalHatch')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 4)
                .attr('height', 4)
              .append('path')
                .attr('d', 'M-3,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
                .attr('stroke', '#000000')
                .attr('stroke-width', 1);
      
      // Needs two rects folded, one for pattern and the other for color
      const topkRects = gTopkRanking.selectAll('.rect_whole_ranking_topk')
              .data(topkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_whole_ranking_topk rect_whole_ranking_topk_' + d.ranking)
              .attr('x', (d) => topkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', gs.individualColor)
              .style('stroke', d3.rgb(gs.individualColor).darker())
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .on('mouseover', (d, i) => {
                tooltip.html('<div>Ranking: ' + d.ranking + '</div>' + 
                             '<div>Group: ' + (d.group == 0 ? 'Men' : 'Women') + '</div>' + 
                             '<div>Cumulative measure up to ranking' + d.ranking + '</div>' +
                             '<div>- Fairness(Statistical Parity): ' + (Math.round(statParityKData[i][1] * 100) / 100) + '</div>' +
                             '<div>- Utility(Precison): ' + (Math.round(precisionKData[i][1] * 100) / 100) + '</div>');
                tooltip.show();
              })
              .on('mouseout', (d, i) => {
                tooltip.hide();
              });

      const topkRectsForPattern = gTopkRanking.selectAll('.rect_whole_ranking_topk_for_pattern')
              .data(topkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_whole_ranking_topk_for_pattern rect_whole_ranking_topk_for_pattern_' + d.ranking)
              .attr('x', (d) => topkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', (d) => !d.target ? 'none': 'url(#diagonalHatch)')
              .style('stroke', 'none')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .on('mouseover', (d, i) => {
                tooltip.html('<div>Ranking: ' + d.ranking + '</div>' + 
                             '<div>Group: ' + (d.group == 0 ? 'Men' : 'Women') + '</div>' + 
                             '<div>Cumulative measure up to ranking' + d.ranking + '</div>' +
                             '<div>- Fairness(Statistical Parity): ' + (Math.round(statParityKData[i][1] * 100) / 100) + '</div>' +
                             '<div>- Utility(Precison): ' + (Math.round(precisionKData[i][1] * 100) / 100) + '</div>');
                tooltip.show();
              })
              .on('mouseout', (d, i) => {
                tooltip.hide();
              });

      const topkGroupRects = gTopkRanking.selectAll('.topk_group_rect')
              .data(topkInstances)
              .enter().append('rect')
              .attr('class', 'topk_group_rect')
              .attr('x', (d) => topkRankingScale(d.ranking))
              .attr('y', (d) => rectHeight * (6/7))
              .attr('width', rectWidth)
              .attr('height', rectHeight / 7)
              .style('fill', (d) => groupColorScale(d.group))
              .style('stroke', 'none')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      const topkTradeoffPlot = gTopkRanking.selectAll('.topk_group_rect')
              .data(topkInstances)
              .enter().append('rect')
              .attr('class', 'topk_group_rect')
              .attr('x', (d) => topkRankingScale(d.ranking))
              .attr('y', (d) => rectHeight * (6/7))
              .attr('width', rectWidth)
              .attr('height', rectHeight / 7)
              .style('fill', (d) => groupColorScale(d.group));

      const selectedNonTopkRects = gSelectedNonTopkRanking.selectAll('.rect_whole_ranking_selected_non_topk')
              .data(selectedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_whole_ranking_selected_non_topk rect_whole_ranking_selected_non_topk_' + d.ranking)
              .attr('x', (d) => selectedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', gs.individualColor)
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .on('mouseover', (d, i) => {
                tooltip.html('<div>Ranking: ' + d.ranking + '</div>' + 
                             '<div>Group: ' + (d.group == 0 ? 'Men' : 'Women') + '</div>' + 
                             '<div>Cumulative measure up to ranking' + d.ranking + '</div>' +
                             '<div>- Fairness(Statistical Parity): ' + (Math.round(statParityKData[i][1] * 100) / 100) + '</div>' +
                             '<div>- Utility(Precison): ' + (Math.round(precisionKData[i][1] * 100) / 100) + '</div>');
                tooltip.show();
              })
              .on('mouseout', (d, i) => {
                tooltip.hide();
              });

      const selectedNonTopkRectsForPattern = gSelectedNonTopkRanking.selectAll('.rect_whole_ranking_selected_non_topk_for_pattern')
              .data(selectedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_whole_ranking_selected_non_topk_for_pattern rect_whole_ranking_selected_non_topk_for_pattern_' + d.ranking)
              .attr('x', (d) => selectedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', (d) => !d.target ? 'none' : 'url(#diagonalHatch)')
              .style('stroke', d3.rgb(gs.individualColor).darker())
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .on('mouseover', (d, i) => {
                tooltip.html('<div>Ranking: ' + d.ranking + '</div>' + 
                             '<div>Group: ' + (d.group == 0 ? 'Men' : 'Women') + '</div>' + 
                             '<div>Cumulative measure up to ranking' + d.ranking + '</div>' +
                             '<div>- Fairness(Statistical Parity): ' + (Math.round(statParityKData[i][1] * 100) / 100) + '</div>' +
                             '<div>- Utility(Precison): ' + (Math.round(precisionKData[i][1] * 100) / 100) + '</div>');
                tooltip.show();
              })
              .on('mouseout', (d, i) => {
                tooltip.hide();
              });

      const selectedNonTopkGroupRects = gSelectedNonTopkRanking.selectAll('.rect_whole_ranking_non_topk')
              .data(selectedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_non_topk_cf rect_non_topk_cf_' + d.ranking)
              .attr('x', (d) => selectedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => rectHeight * (6/7))
              .attr('width', rectWidth)
              .attr('height', rectHeight / 7)
              .style('fill', (d) => groupColorScale(d.group))
              .style('stroke', 'none')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      const precisionKPlotColor = '#c2185b';

      const fittedPrecisionKLineForTopk = d3.line()
              .x((d) => topkRankingScale(d[0]) + 5)
              .y((d) => precisionKScale(d[1])),
            fittedPrecisionKPathForTopk = gTopkRanking.append('path')
              .datum(precisionKData.slice(0, topk))
              .attr('d', fittedPrecisionKLineForTopk)
              .style('stroke', precisionKPlotColor)
              .style('fill', 'none')
              .style('stroke-width', '2px')
              .style('stroke-dasharray', '3,1'),
            fittedPrecisionKCirclesForTopk = gTopkRanking
              .selectAll('.circle_precision_k')
              .data(precisionKData.slice(0, topk))
              .enter().append('circle')
              .attr('class', 'circle_precision_k')
              .attr('cx', (d) => topkRankingScale(d[0]) + 5)
              .attr('cy', (d) => precisionKScale(d[1]))
              .attr('r', 3)
              .style('fill', 'white')
              .style('stroke', precisionKPlotColor)
              .style('stroke-width', 2);

      const fittedStatParityLineForTopk = d3.line()
              .x((d) => topkRankingScale(d[0]) + 5)
              .y((d) => statParityScale(d[1])),
            fittedStatParityPathForTopk = gTopkRanking.append('path')
              .datum(statParityKData.slice(0, topk))
              .attr('d', fittedStatParityLineForTopk)
              .style('stroke', gs.systemColor)
              .style('fill', 'none')
              .style('stroke-width', '2px')
              .style('stroke-dasharray', '3,1'),
            fittedStatParityCirclesForTopk = gTopkRanking
              .selectAll('.rect_stat_parity_k')
              .data(statParityKData.slice(0, topk))
              .enter().append('rect')
              .attr('class', 'rect_stat_parity_k')
              .attr('x', (d) => topkRankingScale(d[0]) + 2.5)
              .attr('y', (d) => statParityScale(d[1]) - 2.5)
              .attr('width', 5)
              .attr('height', 5)
              .style('fill', 'white')
              .style('stroke', gs.systemColor)
              .style('stroke-width', 2);

      const fittedPrecisionKLineForNonTopk = d3.line()
              .x((d) => selectedNonTopkRankingScale(d[0]) + 5)
              .y((d) => precisionKScale(d[1])),
            fittedPrecisionKPathForNonTopk = gSelectedNonTopkRanking.append('path')
              .datum(precisionKData.slice(topk, to))
              .attr('d', fittedPrecisionKLineForNonTopk)
              .style('stroke', precisionKPlotColor)
              .style('fill', 'none')
              .style('stroke-width', '2px')
              .style('stroke-dasharray', '3,1'),
            fittedPrecisionKCirclesForNonTopk = gSelectedNonTopkRanking
              .selectAll('.circle_precision_k')
              .data(precisionKData.slice(topk, to))
              .enter().append('circle')
              .attr('class', 'circle_precision_k')
              .attr('cx', (d) => selectedNonTopkRankingScale(d[0]) + 5)
              .attr('cy', (d) => precisionKScale(d[1]))
              .attr('r', 3)
              .style('fill', 'white')
              .style('stroke', precisionKPlotColor)
              .style('stroke-width', 2);

      const fittedStatParityLineForNonTopk = d3.line()
              .x((d) => selectedNonTopkRankingScale(d[0]) + 5)
              .y((d) => statParityScale(d[1])),
            fittedStatParityPathForNonTopk = gSelectedNonTopkRanking.append('path')
              .datum(statParityKData.slice(topk, to))
              .attr('d', fittedStatParityLineForNonTopk)
              .style('stroke', gs.systemColor)
              .style('fill', 'none')
              .style('stroke-width', '2px')
              .style('stroke-dasharray', '3,1'),
            fittedStatParityCirclesForNonTopk = gSelectedNonTopkRanking
              .selectAll('.circle_stat_parity_k')
              .data(statParityKData.slice(topk, to))
              .enter().append('rect')
              .attr('class', 'rect_stat_parity_k')
              .attr('x', (d) => selectedNonTopkRankingScale(d[0]) + 2.5)
              .attr('y', (d) => statParityScale(d[1]) - 2.5)
              .attr('width', 5)
              .attr('height', 5)
              .style('fill', 'white')
              .style('stroke', gs.systemColor)
              .style('stroke-width', 2);

      const nonTopkRects = gNonTopkRanking.selectAll('.non_topk_rect')
              .data(renderedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'non_topk_rect non_topk_rect_' + d.ranking)
              .attr('x', (d) => renderedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', gs.individualColor)
              .style('stroke', d3.rgb(gs.individualColor).darker())
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .style('opacity', (d, i) => ((renderedNonTopkInstances.length-i) / renderedNonTopkInstances.length));

      const nonTopkRectsForPattern = gNonTopkRanking.selectAll('.non_topk_for_pattern')
              .data(renderedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'non_topk_for_pattern non_topk_for_pattern_' + d.ranking)
              .attr('x', (d) => renderedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', (d) => !d.target ? 'none' : 'url(#diagonalHatch)')
              .style('stroke', d3.rgb(gs.individualColor).darker())
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .style('opacity', (d, i) => ((renderedNonTopkInstances.length-i) / renderedNonTopkInstances.length));

      const nonTopkGroupRects = gNonTopkRanking.selectAll('.non_topk_group_rect')
              .data(renderedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'non_topk_group_rect non_topk_group_rect_' + d.ranking)
              .attr('x', (d) => renderedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => rectHeight * (6/7))
              .attr('width', rectWidth)
              .attr('height', rectHeight / 7)
              .style('fill', (d) => groupColorScale(d.group))
              .style('stroke', 'none')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5)
              .style('opacity', (d, i) => ((renderedNonTopkInstances.length-i) / renderedNonTopkInstances.length));

  
      return (
        <div className={styles.wholeRankingPlot}>
          {svg.toReact()}
        </div>
      );
    }

    render() {
      console.log('RankingView rendered');
      
      if ((!this.props.data || this.props.data.length === 0) ||
          (typeof(this.props.topk) == undefined) ||
          (!this.state.precisionKData || this.state.precisionKData.length === 0) ||
          (!this.state.statParityKData || this.state.statParityKData.length === 0)) {
        return (
          <div />
        )
      }

      const _self = this;

      console.log('isModelRunning in RankingView? ', this.state.isModelRunning);

      const { topk } = this.state;
      const { data, n } = this.props,
            { stat } = data,
            { utility, goodnessOfFairness, groupSkew, GFDCG, rND, sp, cp } = stat,
            instances = _.sortBy([...data.instances], ['ranking'], ['desc']);

      const { precisionKData, statParityKData } = this.state,
            precisionK = precisionKData[topk-1][1],
            statParityK = statParityKData[topk-1][1];

      return (
        <div className={this.props.isModelRunning ? styles.RankingView + ' ' + index.isModelRunning : styles.RankingView}>
          <div className={styles.currentRankingTitle + ' ' + index.title}>
            Ranking View &nbsp;
            <Tag color="#108ee9">{'R' + data.rankingId}</Tag>
          </div>
          <div className={styles.rankingViewTitle  + ' ' + index.subTitle}>
            Measures
          </div>
          <div className={styles.topkSummaryTitle  + ' ' + index.subTitle}>
            <Icon type="filter" theme="outlined" />
            &nbsp;Filter
          </div>
          <div className={styles.wholeRankingSummaryStat}>
            <div className={styles.placeholder}></div>
            <div className={styles.utilityTitle}>
              Utility
              <Tooltip placement="topLeft" title="Prompt Text">
                <Icon 
                  type="question-circle" 
                  theme="twoTone"
                  style={{ fontSize: '15px', verticalAlign: 'text-top', margin: '0 5px' }} 
                />
              </Tooltip>
            </div>
            <div className={styles.fairnessTitle}>
              Fairness
              <Tooltip placement="topLeft" title="Prompt Text">
                <Icon 
                  type="question-circle" 
                  theme="twoTone"
                  style={{ fontSize: '15px', verticalAlign: 'text-top', margin: '0 5px' }} 
                />
              </Tooltip>
            </div>
            <div className={styles.betweenTitle}>Between</div>
            <div className={styles.withinTitle}>Within</div>
            <div className={styles.btnUtility}>
              <UtilityBar 
                measure={utility}
                measureDomain={[0, 1]}
                perfectScore={1}
                color={gs.utilityColor}
              />
            </div>
            <div className={styles.wtnUtility}>
              <UtilityBar 
                measure={precisionK}
                measureDomain={[0, 1]}
                perfectScore={1}
                color={gs.utilityColor}
              />
            </div>
            <div className={styles.btnFairness}>
              <FairnessBar 
                measure={GFDCG}
                measureDomain={[0, 2]}
                perfectScore={1}
                color={gs.fairnessColor}
              />
            </div>
            <div className={styles.wtnFairness}>
              <FairnessBar 
                measure={statParityK}
                measureDomain={[0, 1]}
                perfectScore={0.5}
                color={gs.fairnessColor}
              />
            </div>
          </div>
          <div className={styles.topkFilterView}>
            <div className={styles.topkInputWrapper}>
              <div className={styles.topkFilterTitle}>Top-k</div>
              &nbsp;&nbsp;
              <InputNumber
                className={styles.topkInput}
                size='small'
                min={1}
                max={this.state.selectedRankingInterval.to}
                style={{ width: 40 }}
                value={this.state.topk}
                onChange={this.handleSelectedTopk}
              />
            </div>
            <div className={styles.topkSliderWrapper}>
              <Slider 
                className={styles.topkSlider}
                step={1} 
                min={1}
                max={this.state.selectedRankingInterval.to}
                value={this.state.topk}
                trackStyle={{ backgroundColor: gs.topkColor, height: '5px' }}
                handleStyle={{ backgroundColor: gs.topkColor, border: '2px solid white' }}
                style={{ width: '90%' }}
                onChange={this.handleSelectedTopk} 
              />
            </div>
          </div>
          <div className={styles.intervalFilterView}>            
            <div className={styles.intervalInputWrapper}>
              <div className={styles.intervalFilterTitle}>Interval</div>
              <div>
                <InputNumber
                  size='small'
                  min={1}
                  max={this.props.n}
                  style={{ width: 40 }}
                  value={1}
                />
                <span>&nbsp;-&nbsp;</span>
                <InputNumber
                  size='small'
                  min={1}
                  max={this.props.n}
                  style={{ width: 40 }}
                  value={this.state.selectedRankingInterval.to}
                  onChange={this.handleIntervalChange}
                />
              </div>
            </div>
            <Slider 
              className={styles.intervalSlider}
              step={1} 
              min={1}
              max={this.props.n}
              value={this.state.selectedRankingInterval.to}
              style={{ width: '90%' }}
              trackStyle={{ backgroundColor: gs.nonTopkColor, height: '5px' }}
              handleStyle={{ backgroundColor: gs.nonTopkColor, border: '2px solid white' }}
              onChange={this.handleIntervalChange}
            />
          </div>
          <div className={styles.wholeRankingPlotWrapper}>
            {this.renderWholeRankingPlot()}
          </div>
          <div className={styles.runButtonWrapper}>
            <Button 
              className={styles.buttonGenerateRanking} 
              color='danger' 
              onClick={this.handleFilterRunning}>RUN</Button>
          </div>
        </div>
      );
    }
  }

  export default RankingView;