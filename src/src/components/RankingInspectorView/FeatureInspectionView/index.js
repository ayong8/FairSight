import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';

import styles from "./styles.scss";
import index from "../../../index.css";
import gs from "../../../config/_variables.scss"; // gs (=global style)
import { Table, Divider } from "antd";

function median(array) {
  array.sort(function(a, b) {
    return a - b;
  });
  var mid = array.length / 2;
  return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
}

// CC = Counterfactual and Critical Region analysis
// CR = Critical Region
// CF = Counterfactual
class IndividualFairnessInspectionView extends Component {
  constructor(props) {
    super(props);

    this.svgOutlier;
    this.svgFeatureForOutlier;
    this.svgCR;
    this.svgCCOverview;

    this.layout = {
      outlier: {
        svg: {
          width: 200,
          height: 120
        },
        histogram: {
          width: 200,
          height: 120,
          margin: 10,
          marginBottom: 30
        },
        feature: {
          width: 350,
          height: 100,
          margin: 25,
          marginLeft: 10,
          marginBottom: 25,
          marginBtn: 10,
          widthForInstances: 95,
          heightForInstances: 100,
          widthForOutliers: 95,
          heightForOutliers: 100,
          widthForMedian: 50,
          heightForMedian: 100,
          svg: {
            width: 200,
            height: 120
          },
          plot: {
            width: 250,
            height: 100
          },
          histoForCont: {
            width: 200,
            height: 140,
            margin: 25,
            marginBottom: 30
          },
        }
      },
      cf: {
        overview: {
          svg: {
            width: 300,
            height: 100
          }
        },
        crPlot: {
          width: 300,
          height: 100
        },
        svg: {
          width: 300,
          height: 100
        },
        feature: {
          width: 500,
          height: 90,
          svg: {
            width: 450,
            height: 80,
            margin: 30
          },
          plot: {
            width: 250,
            height: 90,
            margin: 10,
            marginTop: 30
          }
        },
        cr: {
          svg: {
            width: 250,
            height: 100
          },
          plot: {
            width: 200,
            height: 100,
            margin: 25,
            marginBottom: 30
          }
        }
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.perturbationResults !== this.props.perturbationResults;
  }

  renderCategoricalFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedRankingInterval, corrBtnOutliersAndWholeInstances } = this.props;
    const { instances } = data,
          { from, to } = selectedRankingInterval;

    const { name, range, value } = feature,
          avgInstances = _.mean(instances.map((d) => d.features[name]));

    const svgFeature = new ReactFauxDOM.Element('svg');

    svgFeature.setAttribute('width', _self.layout.outlier.feature.svg.width);
    svgFeature.setAttribute('height', _self.layout.outlier.feature.svg.height);
    svgFeature.setAttribute('0 0 200 200');
    svgFeature.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgFeature.setAttribute('class', 'svg_feature_for_outlier');

    const featureBinForInstances = d3.histogram()
            .domain([0, 1])
            .thresholds([0, 1])
            .value((d) => d.features[name])
            (instances);

    const xFeatureScaleForInstances = d3.scaleBand()
            .domain(featureBinForInstances.map((d) => d.x0))
            .range([0, this.layout.outlier.feature.widthForInstances * 2]);

    const xAxisForInstances = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_x_feature_axis_instances')
            .attr('transform', 'translate(0,' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                 _self.layout.outlier.feature.margin) + ')')
            .call(d3.axisBottom(xFeatureScaleForInstances).tickSize(0).tickFormat((d) => d === 0 ? 'No' : 'Yes'));
    const r = 3;
    
    const featureHistogramForInstances = d3.select(svgFeature)
            .selectAll('.g_feature_histogram_for_instances_' + name)
            .data(featureBinForInstances)
            .enter().append('g')
            .attr('class', 'g_feature_histogram_for_instances_' + name)
            .attr('transform', function(d) {
              return 'translate(' + (_self.layout.outlier.feature.margin + _self.layout.outlier.feature.widthForInstances*2/8) + ',' 
                                  + (_self.layout.outlier.feature.height - 5) + ')'; 
            })
            .each(function(d, i) {
              const sortedInstances = _.orderBy(d, 'isOutlier', 'desc'),
                    featureValue = d[0].features[name];

              d3.select(this)
                .selectAll('.circle_categorical_plot')
                .data(sortedInstances)
                .enter().append('circle')
                .attr('class', 'circle_categorical_plot')
                .attr('cx', (e, i) => xFeatureScaleForInstances(featureValue) - r + Math.floor(i/15) * 2*r)
                .attr('cy', (e, i) => - ((i%15) * 2*r))
                .attr('r', (e) => r)
                .style('fill', (e) => e.isOutlier ? gs.outlierColor: gs.individualColor)
                .style('stroke', (e) => d3.rgb(gs.individualColor).darker())
                .style('stroke-width', (e) => 1);
            });

    const diagonalPattern = d3.select(svgFeature)
        .append('defs')
        .append('pattern')
          .attr('id', 'diagonalHatch')
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('width', 4)
          .attr('height', 4)
        .append('path')
          .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
          .attr('stroke', 'red')
          .attr('stroke-width', 1);

    return {
      outlierDiv: 
        <div className={styles.featureForOutlier}>
          {svgFeature.toReact()}
        </div>,
      corrBtnOutliersAndWholeInstances: Math.round(corrBtnOutliersAndWholeInstances[name] * 100) / 100
    }
  }

  renderContinuousFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedRankingInterval, corrBtnOutliersAndWholeInstances } = this.props;
    const { instances } = data,
          { from, to } = selectedRankingInterval,
          selectedInstances = instances.slice(from, to),
          topkInstances = instances.filter((d) => d.ranking <= topk),
          outliers = instances.filter((d) => d.isOutlier);

    const { name, range, value } = feature,
          avgInstances = _.mean(featureValuesForInstances),
          avgOutliers = _.mean(featureValuesForOutliers);

    const featureValuesForInstances = instances.map((d) => d.features[name]),
          featureValuesForOutliers = outliers.map((d) => d.features[name]),
          min = d3.min(featureValuesForInstances),
          max = d3.max(featureValuesForInstances);

    const svgFeature = new ReactFauxDOM.Element('svg');

    svgFeature.setAttribute('width', _self.layout.outlier.feature.svg.width);
    svgFeature.setAttribute('height', _self.layout.outlier.feature.svg.height);
    svgFeature.setAttribute('0 0 200 200');
    svgFeature.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgFeature.setAttribute('class', 'svg_feature_for_outlier');

    const instancesBin = d3.histogram()  // For selected instances
            .domain([min, max])
            .thresholds(d3.range(30).map((d) => min + (max-min) / 30 * d))
            .value((d) => d.features[name])
            (instances);
      
    const xFeatureScale = d3.scaleBand()
            .domain(instancesBin.map((d) => d.x0))
            .range([this.layout.outlier.feature.histoForCont.margin, this.layout.outlier.feature.histoForCont.width - this.layout.outlier.feature.histoForCont.margin]),
          xAxis = d3.select(svgFeature)
                .append('g')
                .attr('class', 'g_x_feature_axis_instances')
                .attr('transform', 'translate(0,' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                    _self.layout.outlier.feature.margin) + ')')
                .call(d3.axisBottom(xFeatureScale).tickValues(xFeatureScale.domain().filter(function(d,i){ return !(i%5)})).tickSizeOuter(0).tickFormat(d3.format('.0f'))),
          r = xFeatureScale.bandwidth() / 2;

    const featureHistogram = d3.select(svgFeature).selectAll('.g_outlier_histogram')
            .data(instancesBin)
            .enter().append('g')
            .attr('class', 'g_outlier_histogram')
            .attr('transform', function(d) {
              return 'translate(' + xFeatureScale(d.x0) + ',' + (_self.layout.outlier.feature.height - _self.layout.outlier.feature.marginBottom +
                                                                 _self.layout.outlier.feature.margin) + ')'; 
            })
            .each(function(d, i) {
              d3.select(this)
                .selectAll('.circle_continuous_histogram')
                .data(_.orderBy(d, ['isOutlier', 'ranking'], ['desc', 'asc']))
                .enter().append('circle')
                .attr('class', 'circle_continuous_histogram')
                .attr('cx', r)
                .attr('cy', (e, i) => - r - (i*(2*r) + 0.5))
                .attr('r', r)
                .style('fill', (e) => e.isTopk ? gs.topkColor : 
                                      e.isOutlier ? 'red' : gs.individualColor)
                .style('stroke', (e) => e.isOutlier ? d3.rgb('red').darker() : (e.isOutlierWithinSelection ? d3.rgb('blue').darker() : d3.rgb(gs.individualColor).darker()))
                .style('stroke-width', (e) => 0.5);
            });

    return {
      outlierDiv: 
        <div className={styles.featureForOutlier}>
          {svgFeature.toReact()}
        </div>,
      corrBtnOutliersAndWholeInstances: Math.round(corrBtnOutliersAndWholeInstances[name] * 100) / 100
    }
  }

  renderOrdinalFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedRankingInterval, corrBtnOutliersAndWholeInstances } = this.props;
    const { instances } = data,
          { from, to } = selectedRankingInterval,
          selectedInstances = instances.slice(from, to),
          topkInstances = instances.filter((d) => d.ranking <= topk),
          outliers = instances.filter((d) => d.isOutlier);

    const { name, range, value } = feature,
          avgInstances = _.mean(instances.map((d) => d.features[name])),
          avgOutliers = _.mean(outliers.map((d) => d.features[name])),
          minOrdinal = Math.min(range),
          maxOrdinal = Math.max(range);

    const svgFeature = new ReactFauxDOM.Element('svg');

    svgFeature.setAttribute('width', _self.layout.outlier.feature.svg.width);
    svgFeature.setAttribute('height', _self.layout.outlier.feature.svg.height);
    svgFeature.setAttribute('0 0 200 200');
    svgFeature.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgFeature.setAttribute('class', 'svg_feature_for_outlier');

    const featureValues = instances.map((d) => d.features[name]);
    const featuresCountObject = _.countBy(featureValues),
          featureValuesCount = Object.keys(featuresCountObject).map((key) => 
            ({ 
              value: parseInt(key), 
              count: featuresCountObject[key],
              instances: instances.filter((d) => d.features[name] === parseInt(key))
            })),
          outlierValues = outliers.map((d) => d.features[name]),
          outliersCountObject = _.countBy(outlierValues),
          outlierValuesCount = Object.keys(outliersCountObject).map((key) => 
            ({ 
              value: key, 
              count: outliersCountObject[key],
              instances: outliers.filter((d) => d.features[name] === parseInt(key))
            }));

    const xFeatureScaleForInstances = d3.scaleBand()
            .domain(range)
            .range([0, this.layout.outlier.feature.widthForInstances * 2]),
          xFeatureScaleForOutliers = d3.scaleBand()
            .domain(range)
            .range([0, this.layout.outlier.feature.widthForOutliers]);

    const xAxisForInstances = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_x_feature_axis_instances')
            .attr('transform', 'translate(0,' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                 _self.layout.outlier.feature.margin) + ')')
            .call(d3.axisBottom(xFeatureScaleForInstances).tickValues([0, ...xFeatureScaleForInstances.domain()]).tickSizeOuter(0));
          // xAxisForOutliers = d3.select(svgFeature)
          //   .append('g')
          //   .attr('class', 'g_x_feature_axis_outliers')
          //   .attr('transform', 'translate(' + (_self.layout.outlier.feature.marginBtn + _self.layout.outlier.feature.widthForInstances) + ',' + 
          //                                     (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + _self.layout.outlier.feature.margin) + ')')
          //   .call(d3.axisBottom(xFeatureScaleForOutliers).tickValues([0, ...xFeatureScaleForOutliers.domain()]).tickSizeOuter(0));
    const rScale = d3.scaleThreshold()
            .domain([1, 5, 10, 25, 50, 100])
            .range([2, 3, 4, 5, 6]);
    const r = 3;

    const diagonalPattern = d3.select(svgFeature)
        .append('defs')
        .append('pattern')
          .attr('id', 'diagonalHatch')
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('width', 4)
          .attr('height', 4)
        .append('path')
          .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
          .attr('stroke', 'red')
          .attr('stroke-width', 1);

    const gFeatureHistogramForInstances = d3.select(svgFeature)
        .selectAll('.g_feature_histogram_for_instances_' + name)
        .data(_.sortBy(featureValuesCount, 'isOutlier', 'desc'))
        .enter().append('g')
        .attr('class', '.g_feature_histogram_for_instances_' + name)
        .attr('transform', function(d) {
          return 'translate(' + (_self.layout.outlier.feature.width/featureValuesCount.length/4) + ',' 
                              + (_self.layout.outlier.feature.height - _self.layout.outlier.feature.marginBottom + _self.layout.outlier.feature.margin - 2*r) + ')'; 
        })
        .each(function(d, i) {
          const { value, count, instances } = d,
                sortedInstances = _.orderBy(instances, 'isOutlier', 'desc');

          sortedInstances.forEach((e, i) => {
            d3.select(this)
              .append('circle')
              .attr('class', 'circle_ordinal_plot')
              .attr('cx', xFeatureScaleForInstances(value) + Math.floor(i/15) * 2*r)
              .attr('cy', - ((i%15) * 2*r))
              .attr('r', r)
              .style('fill', e.isOutlier ? gs.outlierColor : gs.individualColor)
              .style('stroke', d3.rgb(gs.individualColor).darker())
              .style('stroke-width', 1);
          });
        });

    return {
      outlierDiv: 
        <div className={styles.featureForOutlier}>
          {svgFeature.toReact()}
        </div>,
      corrBtnOutliersAndWholeInstances: Math.round(corrBtnOutliersAndWholeInstances[name] * 100) / 100
    }
  }

  renderDistortionOutlierOverview() {
    const _self = this;

    _self.svgOutlier = new ReactFauxDOM.Element('svg');
  
    _self.svgOutlier.setAttribute('width', _self.layout.outlier.svg.width);
    _self.svgOutlier.setAttribute('height', _self.layout.outlier.svg.height);
    _self.svgOutlier.setAttribute('0 0 200 200');
    _self.svgOutlier.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    _self.svgOutlier.setAttribute('class', 'svg_outlier');

    const { data, topk, selectedRankingInterval } = this.props;
    const { instances, features } = data,
          { from, to } = selectedRankingInterval,
          selectedInstances = instances.slice(from, to),
          topkInstances = instances.filter((d) => d.ranking <= topk),
          nonTopkInstances = instances.filter((d) => d.ranking > topk),
          sumDistortions = selectedInstances.map((d) => d.sumDistortion),
          max = d3.max(sumDistortions),
          outlierInstances = instances.filter((d) => d.isOutlier);


    // For outlier distortion overview
    const mean = sumDistortions.reduce((acc, curr) => acc + curr) / sumDistortions.length,
          variance = sumDistortions
            .map((sumDistortion) => Math.pow(sumDistortion - mean, 2))
            .reduce((acc, curr) => acc + curr) / sumDistortions.length,
          std = Math.sqrt(variance);

    instances.map((d) => {
      const threshold = mean + 1.95 * std;
      d.isOutlierWithinSelection = (d.sumDistortion >= threshold) ? true : false;
      d.isTopk = (d.ranking <= topk) ? true : false;

      return d;
    });
    
    const dataBin = d3.histogram()  // For selected instances
            .domain([0, max])
            .thresholds(d3.range(0, max, 1))
            .value((d) => d.sumDistortion)
            (instances);

    const xDistortionScale = d3.scaleBand()
            .domain(dataBin.map((d) => d.x0))
            .range([this.layout.outlier.histogram.margin, this.layout.outlier.histogram.width - this.layout.outlier.histogram.margin]),
          xAxis = d3.select(_self.svgOutlier)
                .append('g')
                .attr('class', 'g_x_distortion_axis')
                .attr('transform', 'translate(0,' + (_self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom + _self.layout.outlier.histogram.margin) + ')')
                .call(d3.axisBottom(xDistortionScale).tickSizeOuter(0).tickValues(xDistortionScale.domain().filter(function(d,i){ return !(i%6)}))),
          r = xDistortionScale.bandwidth() / 2;

    const diagonalPattern = d3.select(_self.svgOutlier)
          .append('defs')
          .append('pattern')
            .attr('id', 'diagonalHatch')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4)
          .append('path')
            .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
            .attr('stroke', 'red')
            .attr('stroke-width', 1);

    const distortionHistogram = d3.select(_self.svgOutlier).selectAll('.g_outlier_histogram')
            .data(dataBin)
            .enter().append('g')
            .attr('class', 'g_outlier_histogram')
            .attr('transform', function(d) {
              return 'translate(' + xDistortionScale(d.x0) + ',' + _self.layout.outlier.histogram.margin + ')'; 
            })
            .each(function(d, i) {
              d3.select(this)
                .selectAll('.circle_histogram')
                .data(_.sortBy(d, 'ranking'))
                .enter().append('circle')
                .attr('class', 'circle_histogram')
                .attr('cx', r)
                .attr('cy', (e, i) => _self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom -
                                      r - (i*xDistortionScale.bandwidth()+0.5))
                .attr('r', r)
                .style('fill', (e) => e.isTopk ? gs.topkColor :
                                      e.isOutlier ? gs.outlierColor : gs.individualColor)
                .style('stroke', (e) => e.isOutlier ? d3.rgb('red').darker() : (e.isOutlierWithinSelection ? d3.rgb('blue').darker() : d3.rgb(gs.individualColor).darker()))
                .style('stroke-width', (e) => 0.5);

              d3.select(this)
                .selectAll('.circle_histogram_outlier_fill')
                .data(_.sortBy(d, 'ranking'))
                .enter().append('circle')
                .attr('class', 'circle_histogram_outlier_fill')
                .attr('cx', r)
                .attr('cy', (e, i) => _self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom -
                                      r - (i*xDistortionScale.bandwidth()+0.5))
                .attr('r', r)
                .style('fill', (e) => e.isOutlier ? 'url(#diagonalHatch)' : 'none');
            });

    return (
      <div className={styles.featureInspectorOverview}>
        {this.svgOutlier.toReact()}
      </div>
    );
  }

  renderOriginalRankingForPerturbation() {
    const _self = this;

    const { data, topk, selectedRankingInterval } = this.props;
    const { instances, features } = data,
          { from, to } = selectedRankingInterval,
          selectedInstances = instances.slice(from, to),
          topkInstances = instances.filter((d) => d.ranking <= topk),
          nonTopkInstances = instances.filter((d) => d.ranking > topk);

    // Original ranking for perturbation
    const svgOriginalRanking = new ReactFauxDOM.Element('svg');

    svgOriginalRanking.setAttribute('width', _self.layout.cf.feature.svg.width);
    svgOriginalRanking.setAttribute('height', _self.layout.cf.feature.svg.height);
    svgOriginalRanking.setAttribute('0 0 200 200');
    svgOriginalRanking.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgOriginalRanking.setAttribute('class', 'svg_feature_for_counterfactual');
    svgOriginalRanking.style.setProperty('background-color', 'white');          

    const n = instances.length,
          rectInterval = 7,
          rectWidth = 5,
          rectHeight = 20,
          plotWidth = rectInterval * topk, // topk and non-topk plot have the same length
          nonTopkRectHeight = (plotWidth / (n - topk)) - 1;

    const topkRankingScale = d3.scaleBand()
            .domain(d3.range(1, topk+1))
            .range([0, plotWidth]),
          nonTopkRankingScale = d3.scaleBand()
            .domain(d3.range(topk+1, n+1))
            .range([0, plotWidth]),
          previousRankingScale = d3.scaleLinear()
            .domain([1, n+1])
            .range([0.5, rectHeight]);

    const xTopkAxis = d3.select(svgOriginalRanking)
            .append('g')
            .attr('class', 'g_x_permutation_axis')
            .attr('transform', 'translate(' + _self.layout.cf.feature.plot.margin + ',' + (_self.layout.cf.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(topkRankingScale).tickValues([1, ...d3.range(5, topk, 5)]).tickSizeOuter(0)),
          xNonTopkAxis = d3.select(svgOriginalRanking)
            .append('g')
            .attr('class', 'g_x_permutation_axis')
            .attr('transform', 'translate(' + (_self.layout.cf.feature.plot.margin + plotWidth) + ',' + (_self.layout.cf.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(nonTopkRankingScale).tickValues([topk+1, ...d3.range(topk+10, n, 10)]).tickSizeOuter(0));

    const gTopkRanking = d3.select(svgOriginalRanking).append('g')
            .attr('class', 'g_top_k_ranking_cf_')
            .attr('transform', 'translate(' + _self.layout.cf.feature.plot.margin + ',' + _self.layout.cf.feature.plot.marginTop + ')'),
          gNonTopkRanking = d3.select(svgOriginalRanking).append('g')
            .attr('class', 'g_non_top_k_ranking_cf_')
            .attr('transform', 'translate(' + (_self.layout.cf.feature.plot.margin + plotWidth) + ',' + _self.layout.cf.feature.plot.marginTop + ')');

    gTopkRanking.selectAll('.rect_topk_cf')
        .data(topkInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_topk_cf rect_topk_cf_' + d.ranking)
        .attr('x', (d) => topkRankingScale(d.ranking))
        .attr('y', (d) => previousRankingScale(d.ranking))
        .attr('width', rectWidth)
        .attr('height', (d) => rectHeight - previousRankingScale(d.ranking))
        .style('fill', gs.topkColor)
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 0.5);

    gNonTopkRanking.selectAll('.rect_non_topk_cf')
        .data(nonTopkInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_non_topk_cf rect_non_topk_cf_' + d.ranking)
        .attr('x', (d) => nonTopkRankingScale(d.ranking))
        .attr('y', (d) => previousRankingScale(d.ranking))
        .attr('width', nonTopkRectHeight)
        .attr('height', (d) => rectHeight - previousRankingScale(d.ranking))
        .style('fill', gs.nonTopkColor)
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 0.5);

    return (
      <div className={styles.featureInspectorOverview}>
        {svgOriginalRanking.toReact()}
      </div>
    );
  }

  // renderCRDistortionPlot() {
  //   const _self = this;

  //   const { data, topk } = this.props;
  //   const { instances } = data,
  //         sumDistortions = instances.map((d) => d.sumDistortion);

  //   const margin = 10,
  //         marginalTopkInstances = instances.slice(topk - margin, topk),
  //         marginalNonTopkInstances = instances.slice(topk, topk + margin);

  //   _self.svgCR = new ReactFauxDOM.Element('svg');

  //   _self.svgCR.setAttribute('width', _self.layout.cf.cr.svg.width);
  //   _self.svgCR.setAttribute('height', _self.layout.cf.cr.svg.height);
  //   _self.svgCR.setAttribute('0 0 200 200');
  //   _self.svgCR.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  //   _self.svgCR.setAttribute('class', 'svg_cr');

  //   const xDistortionScale = d3.scaleLinear()
  //           .domain(d3.extent(sumDistortions))
  //           .range([this.layout.cf.cr.plot.margin * 2, this.layout.cf.cr.plot.width - this.layout.cf.cr.plot.margin]),
  //         xAxis1 = d3.select(_self.svgCR)
  //               .append('g')
  //               .attr('class', 'g_cr_plot_axis')
  //               .attr('transform', 'translate(0,' + (_self.layout.cf.cr.plot.height - _self.layout.cf.cr.plot.marginBottom) + ')')
  //               .call(d3.axisBottom(xDistortionScale).tickSize(1).tickValues(d3.range(0, d3.max(sumDistortions), 5))),
  //         xAxis2 = d3.select(_self.svgCR)
  //               .append('g')
  //               .attr('class', 'g_cr_plot_axis')
  //               .attr('transform', 'translate(0,' + (_self.layout.cf.cr.plot.height - _self.layout.cf.cr.plot.marginBottom * 2) + ')')
  //               .call(d3.axisTop(xDistortionScale).tickSize(1).tickValues(d3.range(0, d3.max(sumDistortions), 5)));

  //   const topkCircles = d3.select(_self.svgCR)
  //           .selectAll('.topk_instances')
  //           .data(marginalTopkInstances)
  //           .enter().append('circle')
  //           .attr('class', 'topk_instances')
  //           .attr('cx', (d) => xDistortionScale(d.sumDistortion))
  //           .attr('cy', (_self.layout.cf.cr.plot.height - _self.layout.cf.cr.plot.marginBottom))
  //           .attr('r', 5)
  //           .style('fill', 'red')
  //           .style('opacity', 0.5),
  //         nonTopkCircles = d3.select(_self.svgCR)
  //           .selectAll('.non_topk_instances')
  //           .data(marginalNonTopkInstances)
  //           .enter().append('circle')
  //           .attr('class', 'non_topk_instances')
  //           .attr('cx', (d) => xDistortionScale(d.sumDistortion))
  //           .attr('cy', (_self.layout.cf.cr.plot.height - _self.layout.cf.cr.plot.marginBottom * 2))
  //           .attr('r', 5)
  //           .style('fill', 'blue')
  //           .style('opacity', 0.5);

  //   return (
  //     <div>
  //       {this.svgCR.toReact()}
  //     </div>
  //   );
  // }

  renderFeaturePerturbation(perturbedRankingInstance) {
    const _self = this;

    const { topk } = this.props;
    const { perturbedFeature, instances, stat, statForPerturbation } = perturbedRankingInstance;

    const svgPerturbation = new ReactFauxDOM.Element('svg');

    svgPerturbation.setAttribute('width', _self.layout.cf.feature.svg.width);
    svgPerturbation.setAttribute('height', _self.layout.cf.feature.svg.height);
    svgPerturbation.setAttribute('0 0 200 200');
    svgPerturbation.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgPerturbation.setAttribute('class', 'svg_feature_for_counterfactual');
    svgPerturbation.style.setProperty('background-color', 'white');

    const topkInstances = instances.filter((d) => d.ranking <= topk),
          nonTopkInstances = instances.filter((d) => d.ranking > topk);

    const n = instances.length,
          rectInterval = 7,
          rectWidth = 5,
          rectHeight = 20,
          plotWidth = rectInterval * topk; // topk and non-topk plot have the same length

    const topkRankingScale = d3.scaleBand()
            .domain(d3.range(1, topk+1))
            .range([0, plotWidth]),
          nonTopkRankingScale = d3.scaleBand()
            .domain(d3.range(topk+1, n+1))
            .range([0, plotWidth]);

    const xTopkAxis = d3.select(svgPerturbation)
            .append('g')
            .attr('class', 'g_x_permutation_axis')
            .attr('transform', 'translate(' + _self.layout.cf.feature.plot.margin + ',' + (_self.layout.cf.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(topkRankingScale).tickValues(d3.range(1, topk, 5)).tickSizeOuter(0)),
          xNonTopkAxis = d3.select(svgPerturbation)
            .append('g')
            .attr('class', 'g_x_permutation_axis')
            .attr('transform', 'translate(' + (_self.layout.cf.feature.plot.margin + plotWidth) + ',' + (_self.layout.cf.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(nonTopkRankingScale).tickValues([topk+1, ...d3.range(topk+10, n, 10)]).tickSizeOuter(0));

    const gTopkRanking = d3.select(svgPerturbation).append('g')
            .attr('class', 'g_top_k_ranking_cf_' + perturbedFeature)
            .attr('transform', 'translate(' + _self.layout.cf.feature.plot.margin + ',' + _self.layout.cf.feature.plot.marginTop + ')'),
          gNonTopkRanking = d3.select(svgPerturbation).append('g')
            .attr('class', 'g_non_top_k_ranking_cf_' + perturbedFeature)
            .attr('transform', 'translate(' + (_self.layout.cf.feature.plot.margin + plotWidth) + ',' + _self.layout.cf.feature.plot.marginTop + ')');

    const previousRankingScale = d3.scaleLinear()
            .domain([1, 100])
            .range([0.5, 15]);

    gTopkRanking.selectAll('.rect_topk_cf')
        .data(topkInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_topk_cf rect_topk_cf_' + d.ranking)
        .attr('x', (d) => topkRankingScale(d.ranking))
        .attr('y', (d) => previousRankingScale(d.previousRanking))
        .attr('width', rectWidth)
        .attr('height', (d) => 20 - previousRankingScale(d.previousRanking))
        .style('fill', (d) => {
          const wasTopk = (d.previousRanking <= topk);
          return wasTopk ? gs.topkColor : gs.nonTopkColor;
        })
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 0.5);

    gTopkRanking.selectAll('.rect_topk_cf_group')
        .data(topkInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_topk_cf_group rect_topk_cf_group_' + d.ranking)
        .attr('x', (d) => topkRankingScale(d.ranking))
        .attr('y', (d) => 20 + 2)
        .attr('width', rectWidth)
        .attr('height', (d) => 5)
        .style('fill', (d) => {
          const wasTopk = (d.previousRanking <= topk);
          return (d.group === 0) ? gs.groupColor1 : gs.groupColor2;
        })
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 0.5);

    // Only render instances within previous topk rankings
    gNonTopkRanking.selectAll('.rect_non_topk_cf')
        .data(nonTopkInstances.filter((d) => d.previousRanking <= topk))
        .enter().append('rect')
        .attr('class', (d) => 'rect_non_topk_cf rect_non_topk_cf_' + d.ranking)
        .attr('x', (d) => nonTopkRankingScale(d.ranking))
        .attr('y', (d) => 0)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .style('fill', (d) => {
          const wasTopk = (d.previousRanking <= topk);
          return wasTopk ? gs.topkColor : gs.nonTopkColor;
        })
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 0.5)
        .style('opacity', 0.5);

    const diffPrecisionK = statForPerturbation.precisionK - stat.precisionK,
          diffSp = statForPerturbation.sp  - stat.sp,
          diffCp = statForPerturbation.cp - stat.cp,
          dissAcc = statForPerturbation.accuracy - stat.accuracy;

    return { 
      perturbationDiv: 
        <div className={styles.featureRow}>
          {svgPerturbation.toReact()}
        </div>,
      diffPrecisionK: Math.round(diffPrecisionK * 100) / 100,
      diffSp: Math.round(diffSp * 100) / 100
    }
  } 

  renderFeatureInspectorTable() {
    const _self = this;

    const { data, topk, perturbationResults, selectedRankingInterval} = this.props;
    const { features, instances } = data,
          { from, to } = selectedRankingInterval,
          selectedInstances = instances.slice(from, to),
          topkInstances = instances.filter((d) => d.ranking <= topk),
          sumDistortions = selectedInstances.map((d) => d.sumDistortion);

    // For outlier analysis
    // Mark the outliers
    const mean = sumDistortions.reduce((acc, curr) => acc + curr) / sumDistortions.length,
          variance = sumDistortions
            .map((sumDistortion) => Math.pow(sumDistortion - mean, 2))
            .reduce((acc, curr) => acc + curr) / sumDistortions.length,
          std = Math.sqrt(variance);

    instances.map((d) => {
      const threshold = mean + 1.95 * std;
      d.isOutlierWithinSelection = (d.sumDistortion >= threshold) ? true : false;
      d.isTopk = (d.ranking <= topk) ? true : false;

      return d;
    });

    // Put feature name, outlier and perturbation column put together
    const tableDataSource = [];
    const featureInspectorColumns = [
      { title: 'Feature', dataIndex: 'feature', width: '8%'},
      { title: 'Measure', dataIndex: 'corrBtnOutliersAndWholeInstances', width: '9%'},
      { title: 'Outlier', dataIndex: 'outlier', width: '22%'},
      { title: 'U', dataIndex: 'diffPrecisionK', width: '7%'},
      { title: 'F', dataIndex: 'diffSp', width: '7%'},
      { title: 'Perturbation', dataIndex: 'perturbation', width: '43%'}
    ];

    // Push the overview
    tableDataSource.push({
      feature: '',
      corrBtnOutliersAndWholeInstances: '',
      outlier: _self.renderDistortionOutlierOverview(),
      diffPrecisionK: '',
      diffSp: '',
      perturbation: _self.renderOriginalRankingForPerturbation()
    });

    perturbationResults.forEach((perturbationResult) => {
      let svgFeature, outlierResultObj;
      console.log('featuresvvv: ', features);
      const featureName = perturbationResult.perturbedFeature;
      console.log('featurevvv: ', featureName);
      const feature = features.filter((d) => d.name === featureName)[0];
      const { name, type, range, value } = feature;

      // For outlier analysis...
      if (type === 'categorical') {
        if (range.length == 2) {
          outlierResultObj = _self.renderCategoricalFeatureForOutlier(feature);
        } else {
          outlierResultObj = _self.renderOrdinalFeatureForOutlier(feature);
        }
      } else if (type === 'continuous') {
          outlierResultObj = _self.renderContinuousFeatureForOutlier(feature);
      }

      const { outlierDiv, corrBtnOutliersAndWholeInstances } = outlierResultObj;

      const { perturbationDiv, diffPrecisionK, diffSp } = _self.renderFeaturePerturbation(perturbationResult);

      tableDataSource.push({
        feature: name.replace(/_/g, ' ').toUpperCase(),
        corrBtnOutliersAndWholeInstances: corrBtnOutliersAndWholeInstances,
        outlier: outlierDiv,
        diffPrecisionK: Math.round(diffPrecisionK * 100) + '%',
        diffSp: Math.round(diffSp * 100) / 100,
        perturbation: perturbationDiv
      });
    });
    
    return (
      <div className={styles.fairnessInspectionWrapper}>
        {/* <div className={styles.featureInspectorOverview}>{this.renderDistortionOutlierOverview()}</div> */}
        {/* <div className={styles.outlierAnalysis}>{this.renderOutlierAnalysis()}</div>
        <div className={styles.ccAnalysis}>{this.renderCC()}</div> */}
        {/* <div className={styles.featureInspectorList}>
          {featureDivs}
        </div> */}
        <Table
          columns={featureInspectorColumns} 
          dataSource={tableDataSource} 
          scroll={{ y: 400 }}
          pagination={false}
        />
      </div>
    );
  }

  render() {
    console.log(this.props);
    if ((!this.props.data.instances || this.props.data.instances.length === 0) ||
        (!this.props.data.features || this.props.data.features.length === 0) ||
        (!this.props.perturbationResults || this.props.perturbationResults.length === 0) ||
        (this.props.perturbationResults.length < this.props.data.features.length))
      return <div />

    return (
      <div className={styles.IndividualFairnessInspectionView}>
        <div className={index.subTitle}>Feature Inspector</div>
        {this.renderFeatureInspectorTable()}
      </div>
    );
  }
}

export default IndividualFairnessInspectionView;
