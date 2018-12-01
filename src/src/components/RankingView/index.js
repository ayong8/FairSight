import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Button } from 'reactstrap';
import { Slider, Icon, InputNumber, Tag } from 'antd';
import dc from 'dc';
import regression from 'regression';

import UtilityView from '../UtilityView';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

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
        isMouseOveredGroupFairness: false
      }

      this.handleSelectedTopk = this.handleSelectedTopk.bind(this);
      this.handleIntervalChange = this.handleIntervalChange.bind(this);
      this.handleFilterRunning = this.handleFilterRunning.bind(this);
      this.handleMouseOverGroupFairness = this.handleMouseOverGroupFairness.bind(this);
    }

    componentWillUpdate() {
      const { isMouseOveredGroupFairness } = this.state;

      if (isMouseOveredGroupFairness === false) {
        d3.selectAll('.rect_whole_ranking_topk')
          .style('stroke-width', 2);
      } else {
        d3.selectAll('.rect_whole_ranking_topk')
          .style('stroke-width', 0.5);
      }
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //   const shouldRunModel = nextProps.data.shouldRunModel;
      
    //   return shouldRunModel;
    // }

    handleSelectedTopk(topk) {
      this.setState({
        topk: topk
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
      this.props.onRunningFilter();
    }

    handleMouseOverGroupFairness() {
      this.setState({
        isMouseOveredGroupFairness: !this.state.isMouseOveredGroupFairness
      });
    }

    renderPlot() {
      let _self = this;

      _self.svgPlot = new ReactFauxDOM.Element('svg');
  
      _self.svgPlot.setAttribute('width', _self.layout.svgPlot.width);
      _self.svgPlot.setAttribute('height', _self.layout.svgPlot.height);
      _self.svgPlot.setAttribute('0 0 200 200');
      _self.svgPlot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _self.svgPlot.setAttribute('transform', 'translate(0,10)');

      let { data, pairwiseDiffs, confIntervalPoints, selectedRankingInterval } = _self.props,
          selectedInstanceIdx = _self.props.selectedRankingInterval;

      // data
      pairwiseDiffs = _.orderBy(pairwiseDiffs, ['scaledDiffInput']);
      const dataWithinGroupPair1 = _.filter(pairwiseDiffs, (d) => d.pair === 1),
            dataWithinGroupPair2 = _.filter(pairwiseDiffs, (d) => d.pair === 2),
            dataWithinGroupPair = _.filter(pairwiseDiffs, (d) => d.pair !== 3),
            dataBetweenGroupPair = _.filter(pairwiseDiffs, (d) => d.pair === 3),
            sumWithinGroupPair1 = dataWithinGroupPair1
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            sumWithinGroupPair2 = dataWithinGroupPair2
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            sumWithinGroupPair = dataWithinGroupPair
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            sumBetweenGroupPair = dataBetweenGroupPair
                    .map((d) => d.distortion)
                    .reduce((sum, curr) => sum + curr),
            absSumWithinGroupPair1 = dataWithinGroupPair1
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            absSumWithinGroupPair2 = dataWithinGroupPair2
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            absSumWithinGroupPair = dataWithinGroupPair
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            absSumBetweenGroupPair = dataBetweenGroupPair
                    .map((d) => d.absDistortion)
                    .reduce((sum, curr) => sum + curr),
            avgWithinGroupPair1 = sumWithinGroupPair1 / dataWithinGroupPair1.length,
            avgWithinGroupPair2 = sumWithinGroupPair2 / dataWithinGroupPair2.length,
            avgWithinGroupPair = absSumWithinGroupPair / dataWithinGroupPair.length,
            avgBetweenGroupPair = absSumBetweenGroupPair / dataBetweenGroupPair.length,
            absAvgWithinGroupPair1 = absSumWithinGroupPair1 / dataWithinGroupPair1.length,
            absAvgWithinGroupPair2 = absSumWithinGroupPair2 / dataWithinGroupPair2.length,
            absAvgWithinGroupPair = absSumWithinGroupPair / dataWithinGroupPair.length,
            absAvgBetweenGroupPair = absSumBetweenGroupPair / dataBetweenGroupPair.length,
            groupSkewAvgs = [
              // absAvgWithinGroupPair1, 
              // absAvgWithinGroupPair2, 
              absAvgBetweenGroupPair,
              absAvgWithinGroupPair
            ];

      // Coordinate scales
      _self.xObservedScale = d3.scaleLinear()
            .domain(d3.extent(pairwiseDiffs, (d) => Math.abs(d.scaledDiffInput)))
            .range([0, _self.layout.plot.width]);
      _self.yDistortionScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([_self.layout.plot.height - _self.layout.plot.padding, _self.layout.plot.padding]);
      _self.xGroupSkewScale = d3.scaleBand()
            .domain([0, 1, 2, 3])
            .range([0, _self.layout.groupSkew.width]);
      _self.yGroupSkewScale = d3.scaleLinear()  // Max value among sum of pairs
            .domain([ 0, Math.max(avgWithinGroupPair1, avgWithinGroupPair2, avgWithinGroupPair, avgBetweenGroupPair) ])
            .range([_self.layout.plot.height, _self.layout.plot.height / 2]);

      const gPlot = d3.select(_self.svgPlot).append('g')
              .attr('class', 'g_plot')
              .attr('transform', 'translate(0, 0)'),
            // gViolinPlot = gPlot.append('g')
            //   .attr('class', 'g_violin_plot')
            //   .attr('transform', 'translate(' + (this.layout.plot.width + 30) + ',' + '0)'),
            gGroupSkew = gPlot.append('g')
              .attr('transform', 'translate(' + (this.layout.plot.width + 30) + ',' + '-25)');

      const xAxisSetting = d3.axisTop(_self.xObservedScale).tickSize(0).ticks(0),
            yAxisSetting = d3.axisRight(_self.yDistortionScale).tickSize(0).ticks(0),
            xAxisGroupSkewSetting = d3.axisTop(_self.xObservedScale).tickSize(0).ticks(0),
            yAxisGroupSkewSetting = d3.axisLeft(_self.yGroupSkewScale).tickSize(0).ticks(0),

            xAxis = gPlot.append('g')
              .call(xAxisSetting)
              .attr('class', 'indi_x_axis')
              .attr('transform', 'translate(0,' + _self.yDistortionScale(0) + ')'),
            yAxis = gPlot.append('g')
              .call(yAxisSetting)
              .attr('class', 'indi_y_axis')
              .attr('transform', 'translate(0,0)'),
            // yAxisGroupSkew = gGroupSkew.append('g')
            //   .call(yAxisSetting)
            //   .attr('class', 'group_skew_y_axis')
            //   .attr('transform', 'translate(60,0)'),
            xAxisLine = xAxis.select('path')
              .style('stroke-width', 3),
            yAxisLine = yAxis.select('path')
              .style('stroke-width', 3);
            // xAxisViolinPlotLine = gViolinPlot.append('line')
            //   .attr('x1', -20)
            //   .attr('y1', _self.yDistortionScale(0))
            //   .attr('x2', 100)
            //   .attr('y2', _self.yDistortionScale(0))
            //   .style('stroke-dasharray', '3,3')
            //   .style('stroke', 'lightgray')
            //   .style('stroke-width', 3),
            // yAxisGroupSkewLine = yAxisGroupSkew.select('path')
            //   .style('stroke-width', 3);

      _self.pairColorScale = d3.scaleThreshold()
            .domain([1, 2, 3, 4])  // pair is one or two or three
            .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor, gs.withinGroupColor]);   

      const margin = 20,
            outlierMargin = 5,
            outlierInterval = 0.05,
            lowerLimit = -0.90,
            upperLimit = 0.90;
            
      let confIntervalLine = d3.line()
          .x((d) => {_self.xObservedScale(d.x)})
          .y((d) => _self.yDistortionScale(d.y));

      const confInterval = gPlot.append('path')
          .datum(confIntervalPoints)
          .attr('class', 'conf_interval_line')
          .attr('d', confIntervalLine)
          .style('stroke', d3.rgb('lightblue').darker())
          .style('stroke-width', 1)
          .style('stroke-dasharray', '2, 2')
          .style('fill', 'lightblue')
          .style('opacity', 0.5);

      const upperOutlierArea = gPlot
                .append('rect')
                .attr('class', 'upper_outlier_rect')
                .attr('x', 0)
                .attr('y', _self.yDistortionScale(1))
                .attr('width', _self.layout.plot.width)
                .attr('height', _self.yDistortionScale(upperLimit) - _self.yDistortionScale(1))
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2'),
            lowerOutlierArea = gPlot
                .append('rect')
                .attr('class', 'lower_outlier_rect')
                .attr('x', 0)
                .attr('y', _self.yDistortionScale(lowerLimit))
                .attr('width', _self.layout.plot.width)
                .attr('height', _self.yDistortionScale(-1) - _self.yDistortionScale(lowerLimit))
                .style('fill', 'pink')
                .style('opacity', 0.5)
                .style('stroke', d3.rgb('pink').darker())
                .style('stroke-dasharray', '2, 2');
  
      const coordsCircles = gPlot
              .selectAll('.coords_circle')
              .data(_.sampleSize(pairwiseDiffs, 100)) // Random sampling by Fisher-Yate shuffle
              .enter().append('circle')
              .attr('class', (d) => {
                const pairCircleClass = 'coords_circle',
                      groupClass = (d.pair === 1) ? 'groupPair1'
                          : (d.pair === 2) ? 'groupPair2'
                          : 'betweenGroupPair',
                      fairClass = (d.isFair === 1) ? 'fairPair'
                          : '',
                      outlierClass = (d.isOutlier === 1) ? 'outlierPair'
                          : '';

                return pairCircleClass + ' ' + groupClass + ' ' + fairClass + ' ' + outlierClass;
              })
              .attr('cx', (d) => _self.xObservedScale(Math.abs(d.scaledDiffInput)))
              .attr('cy', (d) => _self.yDistortionScale(d.distortion))
              .attr('r', 3)
              .style('fill', (d) => _self.pairColorScale(d.pair))
              .style('stroke', (d) => {
                return (d.isFair === 1) ? 'blue'
                  : d.isOutlier ? 'red'
                  : 'black'
              })
              .style('stroke-width', (d) => d.isFair || d.isOutlier ? 2 : 1)
              .style('opacity', 0.8)
              .style('stroke-opacity', 0.8)
              .on('mouseover', function(d, i) {
                    var selectedCircleIdx = i;
                    
                    d3.selectAll('circle.coords_circle')
                      .filter(function(e, i) {
                        return (i !== selectedCircleIdx);
                      })
                      .style('opacity', 0.2);
                    
                    d3.select(this).attr('opacity','0');

                    d3.selectAll('.coords_rect')
                      .style('opacity', 0.2);

                    var circleArc = d3.arc()
                      .innerRadius(0)
                      .outerRadius(5)
                      .startAngle(0)
                      .endAngle(Math.PI);
              })
              .on('mouseout', (d) => {
                    d3.selectAll('.coords_circle')
                      .style('opacity', 0.8);

                    d3.selectAll('.coords_rect')
                      .style('opacity', 1);

                    d3.selectAll('.mouseoverPairColor').remove();
              });

      // Handle mouseover action
      coordsCircles
          .filter((d) => (d.idx1 !== selectedInstanceIdx) && (d.idx2 !== selectedInstanceIdx))
          .style('opacity', 0.1);
              
      // Fit non-linear curved line
      const fit = regression.polynomial(_.map(pairwiseDiffs, (d) => 
              [ Math.abs(d.scaledDiffInput), d.distortion ]
            ), {order: 9}),
            fitBetweenGroup = regression.polynomial(
              _.chain(pairwiseDiffs)
                .filter((d) => d.pair === 3)
                .map((d) => 
                  [ Math.abs(d.scaledDiffInput), d.distortion ]
                )
                .value(), 
              {order: 9}
            ),
            fitWithinGroup = regression.polynomial(
              _.chain(pairwiseDiffs)
                .filter((d) => d.pair === 1)
                .map((d) => 
                  [ Math.abs(d.scaledDiffInput), d.distortion ]
                )
                .value(), 
              {order: 9}
            );

      const fittedLine = d3.line()
              .x((d) => _self.xObservedScale(d[0]))
              .y((d) => _self.yDistortionScale(d[1])),
            fittedPath1 = gPlot.append('path')
              .datum(fit.points)
              .attr('d', fittedLine)
              .style('stroke', 'black')
              .style('fill', 'none')
              .style('stroke-width', '3px')
              .style('stroke-dasharray', '10,10'),
            fittedPath2 = gPlot.append('path')
              .datum(fitBetweenGroup.points)
              .attr('d', fittedLine)
              .style('stroke', '#8dee8c')
              .style('fill', 'none')
              .style('stroke-width', '3px')
              .style('stroke-dasharray', '10,10'),
            fittedPath3 = gPlot.append('path')
              .datum(fitWithinGroup.points)
              .attr('d', fittedLine)
              .style('stroke', 'purple')
              .style('fill', 'none')
              .style('stroke-width', '3px')
              .style('stroke-dasharray', '10,10');
      
      // Violin plot for summary
      const histoChart = d3.histogram()
              .domain(_self.yDistortionScale.domain())
              .thresholds([-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1])
              .value(d => d),
            histoChartWhole = histoChart(_.map(pairwiseDiffs, (d) => d.distortion)),
            histoChartWithinGroupPair1 = histoChart(_.map(dataWithinGroupPair1, (d) => d.distortion)),
            histoChartWithinGroupPair2 = histoChart(_.map(dataWithinGroupPair2, (d) => d.distortion)),
            histoChartBetweenGroupPair = histoChart(_.map(dataBetweenGroupPair, (d) => d.distortion)),
            xViolinPlotWithinGroupPair1Scale = d3.scaleLinear()
              .domain(d3.extent(histoChartWithinGroupPair1, (d) => d.length))
              .range([0, 15]),
            xViolinPlotWithinGroupPair2Scale = d3.scaleLinear()
              .domain(d3.extent(histoChartWithinGroupPair2, (d) => d.length))
              .range([0, 15]),
            xViolinPlotBetweenGroupPairScale = d3.scaleLinear()
              .domain(d3.extent(histoChartBetweenGroupPair, (d) => d.length))
              .range([0, 15]),
            areaWithinGroupPair1 = d3.area()
              .x0(d => -xViolinPlotWithinGroupPair1Scale(d.length))
              .x1(d => xViolinPlotWithinGroupPair1Scale(d.length))
              .y(d => _self.yDistortionScale(d.x0))
              .curve(d3.curveCatmullRom),
            areaWithinGroupPair2 = d3.area()
              .x0(d => -xViolinPlotWithinGroupPair2Scale(d.length))
              .x1(d => xViolinPlotWithinGroupPair2Scale(d.length))
              .y(d => _self.yDistortionScale(d.x0))
              .curve(d3.curveCatmullRom),
            areaBetweenGroupPair = d3.area()
              .x0(d => -xViolinPlotBetweenGroupPairScale(d.length))
              .x1(d => xViolinPlotBetweenGroupPairScale(d.length))
              .y(d => _self.yDistortionScale(d.x0))
              .curve(d3.curveCatmullRom);

      // gViolinPlot.selectAll('.g_violin')
      //     .data([ histoChartWithinGroupPair1, histoChartWithinGroupPair2, histoChartBetweenGroupPair ])
      //     .enter().append('g')
      //     .attr('class', 'g_violin')
      //     .attr('transform', (d, i) => `translate(${i * 40}, 0)`)
      //     .append('path')
      //     .style('stroke','black')
      //     .style('stroke-width', 2)
      //     .style('fill', (d, i) => _self.pairColorScale(i + 1)) // i == 0 => pair == 1 => pair1
      //     .style('fill-opacity', 0.8)
      //     .attr('d', (d, i) => {
      //       if (i+1 === 1)
      //         return areaWithinGroupPair1(d);
      //       else if (i+1 === 2)
      //         return areaWithinGroupPair2(d);
      //       else if (i+1 === 3)
      //         return areaBetweenGroupPair(d);
      //     });

      // Group Skew plot
      // i => 1: groupPairs1, 2: groupPairs2, 3: withinPairs, 4: betweenPairs
      let groupSkewRect1, groupSkewCircle1,
          idx = 1,
          groupSkewScore = Math.round((absAvgBetweenGroupPair / absAvgWithinGroupPair) * 100) / 100; // avgBetweenPairs / avgWithinPairs
    
      gGroupSkew
          .selectAll('.groupSkewRect')
          .data(groupSkewAvgs)
          .enter().append('rect')
          .attr('class', 'groupSkewRect')
          .attr('x', (d, i) => _self.xGroupSkewScale(i + 1))
          .attr('y', (d) => 
            d > 0
              ? _self.yGroupSkewScale(d)
              : _self.yGroupSkewScale(0)
          )
          .attr('width', 10)
          .attr('height', (d) => 
              Math.abs(_self.yGroupSkewScale(d) - _self.yGroupSkewScale(0))
          )
          .style('fill', (d, i) => _self.pairColorScale(i + 3))
          .style('stroke', 'black')
          .style('stroke-width', 1);

      const groupSkewLine = gGroupSkew
            .append('line')
            .attr('x1', 0)
            .attr('y1', _self.yGroupSkewScale(0))
            .attr('x2', 60)
            .attr('y2', _self.yGroupSkewScale(0))
            .style('stroke', 'black')
            .style('stroke-width', 2);

      const btnGroupSkewText = gGroupSkew
            .append('text')
            .attr('x', 5)
            .attr('y', 165)
            .text('BTN');

      const wtnGroupSkewText = gGroupSkew
            .append('text')
            .attr('x', 35)
            .attr('y', 165)
            .text('WTN');
    }
    renderWholeRankingPlot() {
      const _self = this;

      const { data, n } = this.props;
      const { topk, selectedRankingInterval, isMouseOveredGroupFairness } = this.state;
      const { to } = selectedRankingInterval;
      const { instances } = data,
            topkInstances = instances.filter((d) => d.ranking <= topk),
            selectedNonTopkInstances = instances.filter((d) => d.ranking > topk && d.ranking <= to),
            nonTopkInstances = instances.filter((d) => d.ranking > to);

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
            selectedNonTopkPlotWidth = rectInterval * (to - topk + 1);
  
      const topkRankingScale = d3.scaleBand()
              .domain(d3.range(1, topk+1))
              .range([0, topkPlotWidth]),
            selectedNonTopkRankingScale = d3.scaleBand()
              .domain(d3.range(topk+1, to+1))
              .range([0, selectedNonTopkPlotWidth]),
            nonTopkRankingScale = d3.scaleBand()
              .domain(d3.range(to+1, n+1))
              .range([0, topkPlotWidth]),
            groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([0, 1]),
            precisionPlot = d3.scaleLinear()
              .range([0, _self.layout.wholeRankingPlot.plot.height])
              .domain([0, 1]),
            groupProportionPlot = d3.scaleLinear()
              .range([0, _self.layout.wholeRankingPlot.plot.height])
              .domain([0, 1]);

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
                .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
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
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      const topkRectsForPattern = gTopkRanking.selectAll('.rect_whole_ranking_topk_for_pattern')
              .data(topkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_whole_ranking_topk_for_pattern rect_whole_ranking_topk_for_pattern_' + d.ranking)
              .attr('x', (d) => topkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', (d) => !d.target ? 'url(#diagonalHatch)' : 'none')
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      const topkGroupRects = gTopkRanking.selectAll('.topk_group_rect')
              .data(topkInstances)
              .enter().append('rect')
              .attr('class', 'topk_group_rect')
              .attr('x', (d) => topkRankingScale(d.ranking))
              .attr('y', (d) => rectHeight * (6/7))
              .attr('width', rectWidth)
              .attr('height', rectHeight / 7)
              .style('fill', (d) => groupColorScale(d.group))
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      // const accuracyData = [];
      
      // topkInstances.forEach((d) => {

      // });

      // const fittedLine = d3.line()
      //         .x((d) => topkRankingScale(d[0]))
      //         .y((d) => (d[1])),
      //       fittedPath1 = gPlot.append('path')
      //         .datum(fit.points)
      //         .attr('d', fittedLine)
      //         .style('stroke', 'black')
      //         .style('fill', 'none')
      //         .style('stroke-width', '3px')
      //         .style('stroke-dasharray', '10,10'),

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
              .style('stroke-width', 0.5);

      const selectedNonTopkRectsForPattern = gSelectedNonTopkRanking.selectAll('.rect_whole_ranking_selected_non_topk_for_pattern')
              .data(selectedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_whole_ranking_selected_non_topk_for_pattern rect_whole_ranking_selected_non_topk_for_pattern_' + d.ranking)
              .attr('x', (d) => selectedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => 0)
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .style('fill', (d) => !d.target ? 'url(#diagonalHatch)' : 'none')
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      const selectedNonTopkGroupRects = gSelectedNonTopkRanking.selectAll('.rect_whole_ranking_non_topk')
              .data(selectedNonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'rect_non_topk_cf rect_non_topk_cf_' + d.ranking)
              .attr('x', (d) => selectedNonTopkRankingScale(d.ranking))
              .attr('y', (d) => rectHeight * (6/7))
              .attr('width', rectWidth)
              .attr('height', rectHeight / 7)
              .style('fill', (d) => groupColorScale(d.group))
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);
  
      const nonTopkRects = gNonTopkRanking.selectAll('.non_topk_rect')
              .data(nonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'non_topk_rect non_topk_rect_' + d.ranking)
              .attr('x', (d, i) => rectWidth * Math.floor(i / 5))
              .attr('y', (d, i) => (rectHeight / 5) * (i % 5))
              .attr('width', rectHeight / 5)
              .attr('height', rectHeight / 5)
              .style('fill', gs.individualColor)
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);

      const nonTopkRectsForPattern = gNonTopkRanking.selectAll('.non_topk_rect_for_pattern')
              .data(nonTopkInstances)
              .enter().append('rect')
              .attr('class', (d) => 'non_topk_rect_for_pattern non_topk_rect__for_pattern_' + d.ranking)
              .attr('x', (d, i) => rectWidth * Math.floor(i / 5))
              .attr('y', (d, i) => (rectHeight / 5) * (i % 5))
              .attr('width', rectHeight / 5)
              .attr('height', rectHeight / 5)
              .style('fill', (d) => !d.target ? 'url(#diagonalHatch)' : 'none')
              .style('stroke', 'black')
              .style('shape-rendering', 'crispEdge')
              .style('stroke-width', 0.5);
  
      return (
        <div className={styles.wholeRankingPlot}>
          {svg.toReact()}
        </div>
      );
    }

    render() {
      console.log('RankingView rendered');
      if ((!this.props.data || this.props.data.length === 0)) {
        return <div />
      }

      const _self = this;

      this.renderPlot();

      const { data, n } = this.props,
            { stat } = data,
            { utility, goodnessOfFairness, groupSkew, sp, cp } = stat,
            instances = _.sortBy([...data.instances], ['score'], ['desc']).reverse(),
            topk = this.props.topk;

      console.log('statttttt: ', stat);

      return (
        <div className={styles.RankingView}>
          <div className={styles.rankingViewTitle + ' ' + index.title}>
            Current ranking: &nbsp;
            <Tag color="#108ee9">{'R' + data.rankingId}</Tag>
          </div>
          <div className={styles.topkSummaryTitle  + ' ' + index.subTitle}>
            <Icon type="filter" theme="outlined" />
            &nbsp;Filter
          </div>
          <div className={styles.wholeRankingSummaryStat1}>
            <div className={styles.utilityWrapper}>
              <div className={styles.utilityTitle}>Utility</div>
              <div className={styles.utility}>{utility + '%'}</div>
            </div>
            <div className={styles.groupFairnessWrapper}>
              <div 
                className={styles.groupFairnessTitle} 
                onMouseOver={this.handleMouseOverGroupFairness}
                onMouseOut={this.handleMouseOverGroupFairness}
              >Statistical Parity</div>
              <div className={styles.groupFairness}>{sp}</div>
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
                max={this.props.n}
                style={{ width: 40 }}
                value={this.state.topk}
                onChange={this.handleSelectedTopk}
              />
              /{n}
            </div>
            <div className={styles.topkSliderWrapper}>
              <Slider 
                className={styles.topkSlider}
                step={1} 
                min={1}
                max={this.props.n}
                value={this.state.topk}
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