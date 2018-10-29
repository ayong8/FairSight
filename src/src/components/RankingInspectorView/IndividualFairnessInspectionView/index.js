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
          height: 100
        },
        histogram: {
          width: 250,
          height: 100,
          margin: 25,
          marginBottom: 30
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
                .attr('transform', 'translate(0,' + (_self.layout.outlier.histogram.height - _self.layout.outlier.histogram.marginBottom) + ')')
                .call(d3.axisBottom(xDistortionScale).tickValues(d3.range(0, max, 5))),
          r = xDistortionScale.bandwidth() / 2;

    let distortionHistogram;
    distortionHistogram = d3.select(_self.svgOutlier).selectAll('.g_outlier_histogram')
            .data(dataBin)
            .enter().append('g')
            .attr('class', 'g_outlier_histogram')
            .attr('transform', function(d) {
              return 'translate(' + xDistortionScale(d.x0) + ',0)'; 
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
                .style('fill', (e) => e.isTopk ? 'black' : 'gray');
            });

    const selectedFeatures = features.map((d) => d.name),
          feature1 = selectedFeatures[0],
          featuré2 = selectedFeatures[1];

    _self.svgFeatureForOutlier = new ReactFauxDOM.Element('svg');
  
    _self.svgFeatureForOutlier.setAttribute('width', _self.layout.outlier.svg.width);
    _self.svgFeatureForOutlier.setAttribute('height', _self.layout.outlier.svg.height);
    _self.svgFeatureForOutlier.setAttribute('0 0 200 200');
    _self.svgFeatureForOutlier.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    _self.svgFeatureForOutlier.setAttribute('class', 'svg_feature_for_outlier');

    
    

    return (
      <div>
        <div className={styles.outlierTitle + ' ' + index.subTitle}>Outlier Analysis</div>
        {this.svgOutlier.toReact()}
        <div className={styles.featureForOutlier}>
          <div className={styles.titleForFeature}>{selectedFeatures[0]}</div>
          {this.svgFeatureForOutlier.toReact()}
        </div>
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
            .range([this.layout.cr.plot.margin, this.layout.cr.plot.width - this.layout.cr.plot.margin]),
          xAxis = d3.select(_self.svgCR)
                .append('g')
                .attr('class', 'g_cr_plot_axis')
                .attr('transform', 'translate(0,' + (_self.layout.cr.plot.height - _self.layout.cr.plot.marginBottom) + ')')
                .call(d3.axisBottom(xDistortionScale).tickValues(d3.range(0, d3.max(sumDistortions), 5)));

    const topkCircles = d3.select(_self.svgCR)
            .selectAll('.topk_instances')
            .data(marginalTopkInstances)
            .enter().append('circle')
            .attr('class', 'topk_instances')
            .attr('cx', (d) => xDistortionScale(d.sumDistortion))
            .attr('cy', 80)
            .attr('r', 5)
            .style('fill', 'red'),
          nonTopkCircles = d3.select(_self.svgCR)
            .selectAll('.non_topk_instances')
            .data(marginalNonTopkInstances)
            .enter().append('circle')
            .attr('class', 'non_topk_instances')
            .attr('cx', (d) => xDistortionScale(d.sumDistortion))
            .attr('cy', 80)
            .attr('r', 5)
            .style('fill', 'blue');

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
