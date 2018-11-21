import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';

import styles from "./styles.scss";
import index from "../../../index.css";
import gs from "../../../config/_variables.scss"; // gs (=global style)
import { Divider } from "antd";

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
          width: 300,
          height: 150
        },
        histogram: {
          width: 250,
          height: 120,
          margin: 25,
          marginBottom: 30
        },
        feature: {
          width: 350,
          height: 100,
          margin: 25,
          marginBottom: 50,
          widthForInstances: 80,
          heightForInstances: 100,
          widthForOutliers: 80,
          heightForOutliers: 100,
          widthForMedian: 120,
          heightForMedian: 100,
          svg: {
            width: 300,
            height: 100
          },
          plot: {
            width: 250,
            height: 80
          },
          histoForCont: {
            width: 250,
            height: 120,
            margin: 25,
            marginBottom: 30
          },
        }
      },
      cc: {
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
          width: 550,
          height: 100,
          svg: {
            width: 500,
            height: 100,
            margin: 30
          },
          plot: {
            width: 250,
            height: 90,
            margin: 30,
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

  renderCategoricalFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedInstances, corrBtnOutliersAndWholeInstances } = this.props;
    const { instances } = data,
          topkInstances = instances.filter((d) => d.ranking <= topk),
          outliers = instances.filter((d) => d.isOutlier);

    const { name, range, value } = feature,
          avgInstances = _.mean(instances.map((d) => d.features[name])),
          avgOutliers = _.mean(outliers.map((d) => d.features[name]));

    const svgFeature = new ReactFauxDOM.Element('svg');

    svgFeature.setAttribute('width', _self.layout.outlier.feature.svg.width);
    svgFeature.setAttribute('height', _self.layout.outlier.feature.svg.height);
    svgFeature.setAttribute('0 0 200 200');
    svgFeature.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgFeature.setAttribute('class', 'svg_feature_for_outlier');
    svgFeature.style.setProperty('background-color', 'white');
    svgFeature.style.setProperty('border', '1px solid #dddbdb');

    const featureBinForInstances = d3.histogram()
            .domain([0, 1])
            .thresholds([0, 1])
            .value((d) => d.features[name])
            (instances),
          featureBinForOutliers = d3.histogram()
            .domain([0, 1])
            .thresholds([0, 1])
            .value((d) => d.features[name])
            (outliers);

    const xFeatureScaleForInstances = d3.scaleBand()
            .domain(featureBinForInstances.map((d) => d.x0))
            .range([0, this.layout.outlier.feature.widthForInstances]),
          xMedianScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, _self.layout.outlier.feature.widthForMedian]),
          xFeatureScaleForOutliers = d3.scaleBand()
            .domain(featureBinForOutliers.map((d) => d.x0))
            .range([0, this.layout.outlier.feature.widthForOutliers]);

    const xAxisForInstances = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_x_feature_axis_instances')
            .attr('transform', 'translate(0,' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                 _self.layout.outlier.feature.margin) + ')')
            .call(d3.axisBottom(xFeatureScaleForInstances).tickSize(0).tickFormat((d) => d === 0 ? 'No' : 'Yes')),
          xAxisForMedian = d3.select(svgFeature)
            .append('g')
              .attr('class', 'g_x_median_axis')
            .attr('transform', 'translate(' + _self.layout.outlier.feature.widthForInstances + ',' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                                                                      _self.layout.outlier.feature.margin) + ')')
            .call(d3.axisBottom(xMedianScale).ticks(1)),
          xAxisForOutliers = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_x_feature_axis_outliers')
            .attr('transform', 'translate(' + (_self.layout.outlier.feature.widthForInstances + _self.layout.outlier.feature.widthForMedian) + ',' + 
                                              (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + _self.layout.outlier.feature.margin) + ')')
            .call(d3.axisBottom(xFeatureScaleForOutliers).tickSizeOuter(0).tickFormat((d) => d === 0 ? 'No' : 'Yes'));
    const rScale = d3.scaleThreshold()
            .domain([1, 5, 10, 25, 50, 100])
            .range([2, 3, 4, 5, 6]);
    const r = 3;
    
    const featureHistogramForInstances = d3.select(svgFeature)
            .selectAll('.g_feature_histogram_for_instances_' + name)
            .data(featureBinForInstances)
            .enter().append('g')
            .attr('class', 'g_feature_histogram_for_instances_' + name)
            .attr('transform', function(d) {
              return 'translate(' + _self.layout.outlier.feature.margin + ',' 
                                  + (_self.layout.outlier.feature.height - _self.layout.outlier.feature.marginBottom -
                                     _self.layout.outlier.feature.margin) + ')'; 
            })
            .each(function(d, i) {
              let featureValue = d[0].features[name];
              let remainder = d.length;
              let circles = [],
                  dividers = [100, 50, 25, 10, 5, 1],
                  divider = 0,
                  result = 1;

              do {
                for (let i=0; i<dividers.length; i++) {
                  if (dividers[i] < remainder) {
                    divider = dividers[i];
                    break;
                  }
                };
                circles.push(divider);
                remainder -= divider;
              }
              while (remainder >= 0);

              let cumulativeHeight = 0;
              d3.select(this)
                .selectAll('.circle_categorical_plot')
                .data(circles)
                .enter().append('circle')
                .attr('class', 'circle_categorical_plot')
                .attr('cx', (e) => xFeatureScaleForInstances(featureValue) - r)
                .attr('cy', (e, i) => {
                  const cy = rScale(e) + cumulativeHeight + 0.5;
                  cumulativeHeight += 2 * rScale(e);
                  return _self.layout.outlier.feature.marginBottom - cy;
                })
                .attr('r', (e) => rScale(e))
                .style('fill', (e) => gs.individualColor)
                .style('stroke', (e) => 'none')
                .style('stroke-width', (e) => 1);
              
              // d3.select(this)
              //   .selectAll('.circle_categorical_plot')
              //   .data(_.sortBy(d, 'ranking'))
              //   .enter().append('circle')
              //   .attr('class', 'circle_categorical_plot')
              //   .attr('cx', (e) => xFeatureScaleForInstances(e.features[name]) - r)
              //   .attr('cy', (e, i) => - r - (i*(2*r) + 0.5))
              //   .attr('r', r)
              //   .style('fill', (e) => e.isTopk ? 'black' : 'gray')
              //   .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
              //   .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });
    
    const gFeatureMedianPlot = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_feature_median_plot_' + name)
            .attr('transform', function(d) {
              return 'translate(' + _self.layout.outlier.feature.widthForInstances + ',' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                                                            _self.layout.outlier.feature.margin) + ')';
            });

    gFeatureMedianPlot
        .selectAll('.mark_for_avg')
        .data([ avgInstances, avgOutliers ])
        .enter().append('circle')
        .attr('class', 'mark_for_avg')
        .attr('cx', (d) => xMedianScale(d))
        .attr('cy', (d) => 0)
        .attr('r', 2)
        .attr('fill', 'black');

    const featureHistogramForOutliers = d3.select(svgFeature)
            .selectAll('g_feature_histogram_for_outliers_' + name)
            .data(featureBinForOutliers)
            .enter().append('g')
            .attr('class', '.g_feature_histogram_for_outliers_' + name)
            .attr('transform', function(d) {
              return 'translate(' + (_self.layout.outlier.feature.margin + _self.layout.outlier.feature.widthForInstances +
                                     _self.layout.outlier.feature.widthForMedian) + ',0)'; 
            })
            .each(function(d, i) {
              d3.select(this)
                .selectAll('.circle_histogram')
                .data(_.sortBy(d, 'ranking'))
                .enter().append('circle')
                .attr('class', 'circle_histogram')
                .attr('cx', (e) => xFeatureScaleForOutliers(e.features[name]) - r)
                .attr('cy', (e, i) => _self.layout.outlier.feature.height - _self.layout.outlier.feature.marginBottom +
                                      _self.layout.outlier.feature.margin - r - (i*(2*r) + 0.5))
                .attr('r', r)
                .style('fill', gs.outlierColor)
                .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
                .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });

    return (
      <div>
        <div className={styles.featureForOutlierTitle + ' ' + index.featureTitle}>
          <div>{name.replace(/_/g, ' ')}</div>
          <div className={styles.similarity}>{'Distance: ' + Math.round(corrBtnOutliersAndWholeInstances[name] * 100)  / 100}</div>
        </div>
        {svgFeature.toReact()}
      </div>
    );
  }

  renderContinuousFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedInstances, corrBtnOutliersAndWholeInstances } = this.props;
    const { instances } = data,
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
    svgFeature.style.setProperty('background-color', 'white');
    svgFeature.style.setProperty('border', '1px solid #dddbdb');

    const instancesBin = d3.histogram()  // For selected instances
            .domain([min, max])
            .thresholds(d3.range(30).map((d) => min + (max-min) / 30 * d))
            .value((d) => d.features[name])
            (instances);

    console.log('thresholdsss: ', name, d3.range(5).map((d) => Math.round(min + (max-min) / 5 * d * 100) / 100));
      
    const xFeatureScale = d3.scaleBand()
            .domain(instancesBin.map((d) => d.x0))
            .range([this.layout.outlier.feature.histoForCont.margin, this.layout.outlier.feature.histoForCont.width - this.layout.outlier.feature.histoForCont.margin]),
          xAxis = d3.select(svgFeature)
                .append('g')
                .attr('class', 'g_x_feature_axis_instances')
                .attr('transform', 'translate(0,' + (_self.layout.outlier.feature.heightForInstances - _self.layout.outlier.feature.marginBottom + 
                                                    _self.layout.outlier.feature.margin) + ')')
                .call(d3.axisBottom(xFeatureScale).tickSizeOuter(0).tickValues(xFeatureScale.domain().filter(function(d,i){ return !(i%6)})).tickFormat(d3.format(".2f"))),
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
                .data(_.sortBy(d, 'ranking'))
                .enter().append('circle')
                .attr('class', 'circle_continuous_histogram')
                .attr('cx', r)
                .attr('cy', (e, i) => - r - (i*(2*r) + 0.5))
                .attr('r', r)
                .style('fill', (e) => e.isTopk ? gs.topkColor : gs.individualColor)
                .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
                .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });

    console.log('similarityyy: ', corrBtnOutliersAndWholeInstances[name]);
    return (
      <div className={styles.featureForOutlier}>
        <div className={styles.featureForOutlierTitle + ' ' + index.featureTitle}>
          <div>{name.replace(/_/g, ' ')}</div>
          <div className={styles.similarity}>{'Distance: ' + Math.round(corrBtnOutliersAndWholeInstances[name] * 100) / 100}</div>
        </div>
        {svgFeature.toReact()}
      </div>
    );
  }

  renderCRDistortionPlot() {
    const _self = this;

    const { data, topk } = this.props;
    const { instances } = data,
          sumDistortions = instances.map((d) => d.sumDistortion);

    const margin = 10,
          marginalTopkInstances = instances.slice(topk - margin, topk),
          marginalNonTopkInstances = instances.slice(topk, topk + margin);

    _self.svgCR = new ReactFauxDOM.Element('svg');

    _self.svgCR.setAttribute('width', _self.layout.cc.cr.svg.width);
    _self.svgCR.setAttribute('height', _self.layout.cc.cr.svg.height);
    _self.svgCR.setAttribute('0 0 200 200');
    _self.svgCR.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    _self.svgCR.setAttribute('class', 'svg_cr');

    const xDistortionScale = d3.scaleLinear()
            .domain(d3.extent(sumDistortions))
            .range([this.layout.cc.cr.plot.margin * 2, this.layout.cc.cr.plot.width - this.layout.cc.cr.plot.margin]),
          xAxis1 = d3.select(_self.svgCR)
                .append('g')
                .attr('class', 'g_cr_plot_axis')
                .attr('transform', 'translate(0,' + (_self.layout.cc.cr.plot.height - _self.layout.cc.cr.plot.marginBottom) + ')')
                .call(d3.axisBottom(xDistortionScale).tickSize(1).tickValues(d3.range(0, d3.max(sumDistortions), 5))),
          xAxis2 = d3.select(_self.svgCR)
                .append('g')
                .attr('class', 'g_cr_plot_axis')
                .attr('transform', 'translate(0,' + (_self.layout.cc.cr.plot.height - _self.layout.cc.cr.plot.marginBottom * 2) + ')')
                .call(d3.axisTop(xDistortionScale).tickSize(1).tickValues(d3.range(0, d3.max(sumDistortions), 5)));

    const topkCircles = d3.select(_self.svgCR)
            .selectAll('.topk_instances')
            .data(marginalTopkInstances)
            .enter().append('circle')
            .attr('class', 'topk_instances')
            .attr('cx', (d) => xDistortionScale(d.sumDistortion))
            .attr('cy', (_self.layout.cc.cr.plot.height - _self.layout.cc.cr.plot.marginBottom))
            .attr('r', 5)
            .style('fill', 'red')
            .style('opacity', 0.5),
          nonTopkCircles = d3.select(_self.svgCR)
            .selectAll('.non_topk_instances')
            .data(marginalNonTopkInstances)
            .enter().append('circle')
            .attr('class', 'non_topk_instances')
            .attr('cx', (d) => xDistortionScale(d.sumDistortion))
            .attr('cy', (_self.layout.cc.cr.plot.height - _self.layout.cc.cr.plot.marginBottom * 2))
            .attr('r', 5)
            .style('fill', 'blue')
            .style('opacity', 0.5);

    return (
      <div>
        {this.svgCR.toReact()}
      </div>
    );
  }

  renderCCForFeature(perturbedRankingInstance) {
    const _self = this;

    const { topk } = this.props;
    const { perturbedFeature, instances, stat, statForPerturbation } = perturbedRankingInstance;

    const svgFeature = new ReactFauxDOM.Element('svg');

    svgFeature.setAttribute('width', _self.layout.cc.feature.svg.width);
    svgFeature.setAttribute('height', _self.layout.cc.feature.svg.height);
    svgFeature.setAttribute('0 0 200 200');
    svgFeature.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgFeature.setAttribute('class', 'svg_feature_for_counterfactual');
    svgFeature.style.setProperty('background-color', 'white');

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
            .range([0, plotWidth]),
          groupColorScale = d3.scaleOrdinal()
            .range([gs.groupColor1, gs.groupColor2])
            .domain([0, 1]);

    const xTopkAxis = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_x_counterfactual_axis')
            .attr('transform', 'translate(' + _self.layout.cc.feature.plot.margin + ',' + (_self.layout.cc.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(topkRankingScale).tickValues(d3.range(1, topk, 5))),
          xNonTopkAxis = d3.select(svgFeature)
            .append('g')
            .attr('class', 'g_x_counterfactual_axis')
            .attr('transform', 'translate(' + (_self.layout.cc.feature.plot.margin + plotWidth) + ',' + (_self.layout.cc.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(nonTopkRankingScale).tickValues(d3.range(topk+1, n, 10)));

    const gTopkRanking = d3.select(svgFeature).append('g')
            .attr('class', 'g_top_k_ranking_cf_' + perturbedFeature)
            .attr('transform', 'translate(' + _self.layout.cc.feature.plot.margin + ',' + _self.layout.cc.feature.plot.marginTop + ')'),
          gNonTopkRanking = d3.select(svgFeature).append('g')
            .attr('class', 'g_non_top_k_ranking_cf_' + perturbedFeature)
            .attr('transform', 'translate(' + (_self.layout.cc.feature.plot.margin + plotWidth) + ',' + _self.layout.cc.feature.plot.marginTop + ')');

    gTopkRanking.selectAll('.rect_topk_cf')
        .data(topkInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_topk_cf rect_topk_cf_' + d.ranking)
        .attr('x', (d) => topkRankingScale(d.ranking))
        .attr('y', (d) => 0)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .style('fill', (d) => {
          const wasTopk = (d.previousRanking <= topk);
          return wasTopk ? gs.topkColor : gs.nonTopkColor;
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

    console.log('stat: ', stat);
    console.log('statForPerturbation: ', statForPerturbation);

    const diffAcc = stat.accuracy - statForPerturbation.accuracy,
          diffSp = stat.sp - statForPerturbation.sp,
          diffCp = stat.cp - statForPerturbation.cp;

    return (
      <div className={styles.ccForFeature}>
        <div className={index.featureTitle}>{perturbedFeature.replace(/_/g, ' ')}</div>
        <div className={index.perturbedMeasure}>{'RANKING CHANGES: ' + 0 + '  ' + 'ACC: ' + diffAcc + '  ' + 'SP: ' + diffSp}</div>
        {svgFeature.toReact()}
      </div>
    );
  }

  renderCC() {
    const _self = this;

    const { data, topk, perturbationResults} = this.props;
    const { features, instances } = data;

    console.log('dataaaa: ', data);

    const svgCCOverview = new ReactFauxDOM.Element('svg');

    svgCCOverview.setAttribute('width', _self.layout.cc.overview.svg.width);
    svgCCOverview.setAttribute('height', _self.layout.cc.overview.svg.height);
    svgCCOverview.setAttribute('0 0 200 200');
    svgCCOverview.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgCCOverview.setAttribute('class', 'svg_cc_overview');
    svgCCOverview.style.setProperty('border', '1px solid #dfdfdf');
    svgCCOverview.style.setProperty('background-color', 'white');

    const svgOriginalRanking = new ReactFauxDOM.Element('svg');

    svgOriginalRanking.setAttribute('width', _self.layout.cc.feature.svg.width);
    svgOriginalRanking.setAttribute('height', _self.layout.cc.feature.svg.height);
    svgOriginalRanking.setAttribute('0 0 200 200');
    svgOriginalRanking.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgOriginalRanking.setAttribute('class', 'svg_feature_for_counterfactual');
    svgOriginalRanking.style.setProperty('background-color', 'white');

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
            .range([0, plotWidth]),
          groupColorScale = d3.scaleOrdinal()
            .range([gs.groupColor1, gs.groupColor2])
            .domain([0, 1]);

    const xTopkAxis = d3.select(svgOriginalRanking)
            .append('g')
            .attr('class', 'g_x_counterfactual_axis')
            .attr('transform', 'translate(' + _self.layout.cc.feature.plot.margin + ',' + (_self.layout.cc.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(topkRankingScale).tickValues([1, ...d3.range(5, topk, 5)])),
          xNonTopkAxis = d3.select(svgOriginalRanking)
            .append('g')
            .attr('class', 'g_x_counterfactual_axis')
            .attr('transform', 'translate(' + (_self.layout.cc.feature.plot.margin + plotWidth) + ',' + (_self.layout.cc.feature.plot.marginTop + rectHeight + 10) + ')')
            .call(d3.axisBottom(nonTopkRankingScale).tickValues([topk+1, ...d3.range(topk+10, n, 10)]));

    const gTopkRanking = d3.select(svgOriginalRanking).append('g')
            .attr('class', 'g_top_k_ranking_cf_')
            .attr('transform', 'translate(' + _self.layout.cc.feature.plot.margin + ',' + _self.layout.cc.feature.plot.marginTop + ')'),
          gNonTopkRanking = d3.select(svgOriginalRanking).append('g')
            .attr('class', 'g_non_top_k_ranking_cf_')
            .attr('transform', 'translate(' + (_self.layout.cc.feature.plot.margin + plotWidth) + ',' + _self.layout.cc.feature.plot.marginTop + ')');

    const topkLine = d3.select(svgOriginalRanking).append('line')
            .attr('x1', _self.layout.cc.feature.plot.margin + topkRankingScale(topk))
            .attr('y1', _self.layout.cc.feature.plot.margin)
            .attr('x2', _self.layout.cc.feature.plot.margin + topkRankingScale(topk))
            .attr('y2', _self.layout.cc.feature.plot.marginTop + rectHeight + 10)
            .style('stroke', 'black')
            .style('stroke-width', 2)
            .style('stroke-dashearray', '1,1');

    gTopkRanking.selectAll('.rect_topk_cf')
        .data(topkInstances)
        .enter().append('rect')
        .attr('class', (d) => 'rect_topk_cf rect_topk_cf_' + d.ranking)
        .attr('x', (d) => topkRankingScale(d.ranking))
        .attr('y', (d) => 0)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .style('fill', gs.topkColor)
        .style('stroke', 'black')
        .style('shape-rendering', 'crispEdge')
        .style('stroke-width', 0.5);

    return (
      <div>
        <div className={styles.ccTitle + ' ' + index.subTitle}>Counterfactuals & Critical Regions</div>
          {svgCCOverview.toReact()}
          <div> </div>
          {/* {this.renderCRDistortionPlot()} */}
          {svgOriginalRanking.toReact()}
        <div className={styles.featureImpactsList}>
          <div className={index.subTitle2}>FEATURES</div>
          {perturbationResults.map((perturbationResult) => _self.renderCCForFeature(perturbationResult))}
        </div>
      </div>
    );
  }

  renderOutlierAnalysis() {
    const _self = this;

    _self.svgOutlier = new ReactFauxDOM.Element('svg');
  
    _self.svgOutlier.setAttribute('width', _self.layout.outlier.svg.width);
    _self.svgOutlier.setAttribute('height', _self.layout.outlier.svg.height);
    _self.svgOutlier.setAttribute('0 0 200 200');
    _self.svgOutlier.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    _self.svgOutlier.setAttribute('class', 'svg_outlier');

    const { data, topk, selectedInstances } = this.props;
    const { instances, features } = data,
          topkInstances = instances.filter((d) => d.ranking <= topk),
          sumDistortions = selectedInstances.map((d) => d.sumDistortion),
          max = d3.max(sumDistortions),
          outlierInstances = instances.filter((d) => d.isOutlier);

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
                .call(d3.axisBottom(xDistortionScale).tickSizeOuter(0)),
          r = xDistortionScale.bandwidth() / 2;

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
                .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
                .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });

    const featureDivs = [];

    features.forEach((feature) => {
      let svgFeature, featureDiv;
      const { name, type, range, value } = feature;

      if (type === 'categorical') {
        featureDiv = _self.renderCategoricalFeatureForOutlier(feature);
      } else if (type === 'continuous') {
        featureDiv = _self.renderContinuousFeatureForOutlier(feature);
      }

      featureDivs.push(featureDiv);
    });

    return (
      <div>
        <div className={styles.outlierTitle + ' ' + index.subTitle}>Outlier Analysis</div>
        {this.svgOutlier.toReact()}
        <div className={styles.featureListForOutlier}>
          <div className={styles.outlierTitle + ' ' + index.subTitle2}>FEATURES</div>
          {featureDivs}
        </div>
      </div>
    );
  }

  render() {
    if ((!this.props.perturbationResults || this.props.perturbationResults.length === 0) ||
        (Object.keys(this.props.corrBtnOutliersAndWholeInstances).length === 0)
    ) {
      return <div />
    }

    return (
      <div className={styles.IndividualFairnessInspectionView}>
        <div className={index.subTitle}>Feature Inspector</div>
        <div className={styles.fairnessInspectionWrapper}>
          <div className={styles.outlierAnalysis}>{this.renderOutlierAnalysis()}</div>
          <div className={styles.ccAnalysis}>{this.renderCC()}</div>
        </div>
      </div>
    );
  }
}

export default IndividualFairnessInspectionView;
