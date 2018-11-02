import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';

import styles from "./styles.scss";
import index from "../../../index.css";
import gs from "../../../config/_variables.scss"; // gs (=global style)

class IndividualFairnessInspectionView extends Component {
  constructor(props) {
    super(props);

    this.svgOutlier;
    this.svgFeatureForOutlier

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
          widthForMedian: 150,
          heightForMedian: 100,
          svg: {
            width: 300,
            height: 100
          },
          plot: {
            width: 250,
            height: 80
          }
        }
      },
      cr: {
        svg: {
          width: 300,
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
      const threshold = mean + 1.95*std;
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
          // yDistortionScale = d3.scaleLinear()
          //   .domain(d3.extent(dataBin, (d) => d.length))
          //   .range([_self.layout.outlier.histogram.height, this.layout.outlier.histogram.margin]),
          xAxis = d3.select(_self.svgOutlier)
                .append('g')
                .attr('class', 'g_x_distortion_axis')
                .attr('transform', 'translate(0,' + (_self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom + _self.layout.outlier.histogram.margin) + ')')
                .call(d3.axisBottom(xDistortionScale).tickValues(d3.range(0, max, 5))),
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
                .style('fill', (e) => e.isTopk ? 'black' : 'gray')
                .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
                .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });

    const selectedFeatures = features.map((d) => d.name),
          feature1 = selectedFeatures[0],
          featuré2 = selectedFeatures[1],
          featureDivs = [];

    features.forEach((feature) => {
      let svgFeature, featureDiv;
      const type = 'categorical';

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
        <div className={styles.featureForOutlier}>
          {/* <div className={styles.titleForFeature}>{selectedFeatures[0]}</div> */}
          {featureDivs}
        </div>
      </div>
    );
  }

  renderCategoricalFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedInstances } = this.props;
    const { instances } = data,
          topkInstances = instances.filter((d) => d.ranking <= topk),
          outliers = instances.filter((d) => d.isOutlier);

    const { name, range, value } = feature,
          avgInstances = 0.3,
          avgOutliers = 0.5;

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
            .call(d3.axisBottom(xFeatureScaleForOutliers).tickSize(0).tickFormat((d) => d === 0 ? 'No' : 'Yes'));
    const r = 5;

    const featureHistogramForInstances = d3.select(svgFeature)
            .selectAll('.g_feature_histogram_for_instances_' + name)
            .data(featureBinForInstances)
            .enter().append('g')
            .attr('class', '.g_feature_histogram_for_instances_' + name)
            .attr('transform', function(d) {
              return 'translate(' + _self.layout.outlier.feature.margin + ',' + _self.layout.outlier.feature.margin + ')'; 
            })
            .each(function(d, i) {
              d3.select(this)
                .selectAll('.circle_histogram')
                .data(_.sortBy(d, 'ranking'))
                .enter().append('circle')
                .attr('class', 'circle_histogram')
                .attr('cx', r)
                .attr('cy', (e, i) => _self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom -
                                      r - (i*r + 0.5))
                .attr('r', r)
                .style('fill', (e) => e.isTopk ? 'black' : 'gray')
                .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
                .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });
    
    const gFeatureMedianPlot = d3.select(svgFeature)
            .append('g')
            .attr('class', '.g_feature_median_plot_' + name)
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
            .selectAll('.g_feature_histogram_for_outliers_' + name)
            .data(featureBinForOutliers)
            .enter().append('g')
            .attr('class', '.g_feature_histogram_for_outliers_' + name)
            .attr('transform', function(d) {
              return 'translate(' + (_self.layout.outlier.feature.margin + _self.layout.outlier.feature.widthForInstances) + ',' + 
                                     _self.layout.outlier.feature.margin + ')'; 
            })
            .each(function(d, i) {
              d3.select(this)
                .selectAll('.circle_histogram')
                .data(_.sortBy(d, 'ranking'))
                .enter().append('circle')
                .attr('class', 'circle_histogram')
                .attr('cx', r)
                .attr('cy', (e, i) => _self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom -
                                      r - (i*r + 0.5))
                .attr('r', r)
                .style('fill', (e) => e.isTopk ? 'black' : 'gray')
                .style('stroke', (e) => e.isOutlier ? 'red' : (e.isOutlierWithinSelection ? 'blue' : 'none'))
                .style('stroke-width', (e) => e.isOutlier ? 1 : (e.isOutlierWithinSelection ? 1 : 0));
            });

    return (
      <div>
        <div>{name}</div>
        {svgFeature.toReact()}
      </div>
    );
  }

  renderContinuousFeatureForOutlier(feature) {
    const _self = this;

    const { data, topk, selectedInstances } = this.props;
    const { instances } = data,
          topkInstances = instances.filter((d) => d.ranking <= topk),
          outliers = instances.filter((d) => d.isOutlier);

    const { name, range, value } = feature;

    const svgFeature = new ReactFauxDOM.Element('svg');

    svgFeature.setAttribute('width', _self.layout.outlier.feature.svg.width);
    svgFeature.setAttribute('height', _self.layout.outlier.feature.svg.height);
    svgFeature.setAttribute('0 0 200 200');
    svgFeature.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgFeature.setAttribute('class', 'svg_feature_for_outlier');

    return (
      <div>
        <div>name</div>
        {svgFeature.toReact()}
      </div>
    );
  }

  renderCriticalRegionAnalysis() {
    const _self = this;

    const { data, topk } = this.props;
    const { instances } = data,
          sumDistortions = instances.map((d) => d.sumDistortion);

    const margin = 10,
          marginalTopkInstances = instances.slice(topk - margin, topk),
          marginalNonTopkInstances = instances.slice(topk, topk + margin);

    _self.svgCR = new ReactFauxDOM.Element('svg');

    _self.svgCR.setAttribute('width', _self.layout.cr.svg.width);
    _self.svgCR.setAttribute('height', _self.layout.cr.svg.height);
    _self.svgCR.setAttribute('0 0 200 200');
    _self.svgCR.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    _self.svgCR.setAttribute('class', 'svg_cr');

    const xDistortionScale = d3.scaleLinear()
            .domain(d3.extent(sumDistortions))
            .range([this.layout.cr.plot.margin * 2, this.layout.cr.plot.width - this.layout.cr.plot.margin]),
          xAxis1 = d3.select(_self.svgCR)
                .append('g')
                .attr('class', 'g_cr_plot_axis')
                .attr('transform', 'translate(0,' + (_self.layout.cr.plot.height - _self.layout.cr.plot.marginBottom) + ')')
                .call(d3.axisBottom(xDistortionScale).tickSize(1).tickValues(d3.range(0, d3.max(sumDistortions), 5))),
          xAxis2 = d3.select(_self.svgCR)
                .append('g')
                .attr('class', 'g_cr_plot_axis')
                .attr('transform', 'translate(0,' + (_self.layout.cr.plot.height - _self.layout.cr.plot.marginBottom * 2) + ')')
                .call(d3.axisTop(xDistortionScale).tickSize(1).tickValues(d3.range(0, d3.max(sumDistortions), 5)));

    const topkCircles = d3.select(_self.svgCR)
            .selectAll('.topk_instances')
            .data(marginalTopkInstances)
            .enter().append('circle')
            .attr('class', 'topk_instances')
            .attr('cx', (d) => xDistortionScale(d.sumDistortion))
            .attr('cy', (_self.layout.cr.plot.height - _self.layout.cr.plot.marginBottom))
            .attr('r', 5)
            .style('fill', 'red')
            .style('opacity', 0.5),
          nonTopkCircles = d3.select(_self.svgCR)
            .selectAll('.non_topk_instances')
            .data(marginalNonTopkInstances)
            .enter().append('circle')
            .attr('class', 'non_topk_instances')
            .attr('cx', (d) => xDistortionScale(d.sumDistortion))
            .attr('cy', (_self.layout.cr.plot.height - _self.layout.cr.plot.marginBottom * 2))
            .attr('r', 5)
            .style('fill', 'blue')
            .style('opacity', 0.5);

    return (
      <div>
        <div className={styles.outlierTitle + ' ' + index.subTitle}>Critical Region Analysis</div>
        {this.svgCR.toReact()}
        <div className={styles.featureForOutlier}>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={styles.IndividualFairnessInspectionView}>
        <div className={styles.outlierAnalysis}>{this.renderOutlierAnalysis()}</div>
        <div className={styles.criticalRegionAnalysis}>{this.renderCriticalRegionAnalysis()}</div>
        <div className={styles.counterfactualAnalysis}></div>
      </div>
    );
  }
}

export default IndividualFairnessInspectionView;
