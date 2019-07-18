import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table, Icon, Badge, Progress } from 'antd';

import styles from './styles.scss';
import index from '../../../index.css';
import gs from '../../../config/_variables.scss'; // gs (=global style)

class LocalInspectionView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderIndividualFeatureTable() {
    const _self = this;
    const { selectedInstance, selectedInstanceNNs, features } = this.props,
      nSelectedInstanceNNs = selectedInstanceNNs.length;

    return features.map((feature, idx) => {
      const svg = new ReactFauxDOM.Element('svg');

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '25px');
      svg.setAttribute('class', 'svg_ranking_plot');

      const featureName = d3
        .select(svg)
        .append('text')
        .attr('x', 0)
        .attr('y', 15)
        .text(feature.name.replace(/_/g, ' '));

      const individualValue = selectedInstance.features[feature.name],
        neighborsValue =
          _.sum(selectedInstanceNNs.map(d => d.x2.features[feature.name])) /
          nSelectedInstanceNNs;

      const g = d3
        .select(svg)
        .append('g')
        .attr('transform', 'translate(150,10)');

      const xFeatureScale = d3
          .scaleLinear()
          .domain([d3.min(feature.range), d3.max(feature.range)])
          .range([0, 50]),
        xAxis = g
          .append('g')
          .attr('class', 'g_x_feature_axis_individual')
          .attr('transform', 'translate(0,0)')
          .call(
            d3
              .axisBottom(xFeatureScale)
              .tickSize(5)
              .tickSizeOuter(0)
              .tickValues([d3.min(feature.range), d3.max(feature.range)])
          );
      //.tickValues(xFeatureScale.domain().filter(function(d,i){ return !(i%5)})).tickSizeOuter(0).tickFormat(d3.format('.0f'))

      const indiCircle = g
        .append('circle')
        .attr('cx', xFeatureScale(individualValue))
        .attr('cy', 1)
        .attr('r', 3)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      const neighborCircle = g
        .append('circle')
        .attr('cx', xFeatureScale(neighborsValue))
        .attr('cy', 1)
        .attr('r', 3)
        .style('fill', 'none')
        .style('stroke', 'blue')
        .style('stroke-width', 2);

      return {
        feature: svg.toReact(),
        individualValue: individualValue,
        neighborsValue: neighborsValue
      };
    });
  }

  renderIndividualEmptyTable() {
    const { features } = this.props;

    return features.map(d => {
      return {
        feature: d.name.replace(/_/g, ' '),
        individualValue: '',
        neighborsValues: ''
      };
    });
  }

  renderGroupFeatureTable() {
    const _self = this;
    const { instances } = this.props.rankingInstance,
      nonProtectedGroup = instances.filter(d => d.group === 0),
      protectedGroup = instances.filter(d => d.group === 1),
      nNonProtectedGroup = nonProtectedGroup.length,
      nProtectedGroup = protectedGroup.length;

    return Object.keys(instances[0].features).map((feature, idx) => {
      return {
        feature: feature.replace(/_/g, ' '),
        nonProtectedGroupValue:
          Math.round(
            (_.sum(nonProtectedGroup.map(d => d.features[feature])) /
              nNonProtectedGroup) *
              100
          ) / 100,
        protectedGroupValue:
          Math.round(
            (_.sum(protectedGroup.map(d => d.features[feature])) /
              nProtectedGroup) *
              100
          ) / 100
      };
    });
  }

  render() {
    console.log('LocalInspectionView rendered');
    const { selectedInstance, rankingInstance, rNN, rNNGain } = this.props,
      { instances, sensitiveAttr, stat } = rankingInstance,
      { rNNSum, rNNSumNonProtectedGroup, rNNSumProtectedGroup } = stat,
      { protectedGroup, nonProtectedGroup } = sensitiveAttr,
      featureNames = Object.keys(instances[0].features);

    const columnsForIndividual = [
      { title: 'Feature', dataIndex: 'feature', width: '60%' },
      { title: 'Individual', dataIndex: 'individualValue', width: '20%' },
      { title: 'Neighbors', dataIndex: 'neighborsValue', width: '20%' }
    ];

    const columnsForGroup = [
      { title: 'Feature', dataIndex: 'feature', width: '60%' },
      {
        title: 'Non-protected',
        dataIndex: 'nonProtectedGroupValue',
        width: '20%'
      },
      { title: 'Protected', dataIndex: 'protectedGroupValue', width: '20%' }
    ];

    return (
      <div className={styles.LocalInspectionView}>
        <div className={index.title + ' ' + styles.localInspectorTitle}>
          Local Inspector
        </div>
        <div className={styles.IndividualStatus}>
          <div className={styles.individualInspectionTitle}>
            Individual Inspection
          </div>
          {/* <Icon type="user" style={{ fontSize: 50, backgroundColor: 'white', border: '1px solid grey', marginBottom: 10}}/> */}
          <div>
            <Badge status="success" />
            <span className={index.instanceIdTitle}>Instance ID:&nbsp;</span>
            {selectedInstance && Object.keys(selectedInstance).length !== 0
              ? selectedInstance.idx
              : ''}
          </div>
          <div className={styles.individualMeasures}>
            <Badge status="success" />
            {'Ranking: ' + selectedInstance.ranking}
          </div>
          <div className={styles.individualMeasures}>
            <Badge status="success" />
            {'rNN: ' + Math.round(rNN * 100) / 100}
          </div>
          <div className={styles.individualMeasures}>
            <Badge status="success" />
            {'rNN (gain): ' + Math.round(rNNGain * 100) / 100}
          </div>
          <div className={styles.instanceDataTableWrapper}>
            <Table
              className={styles.instanceDataTable}
              columns={columnsForIndividual}
              dataSource={
                selectedInstance && Object.keys(selectedInstance).length !== 0
                  ? this.renderIndividualFeatureTable()
                  : this.renderIndividualEmptyTable()
              }
              scroll={{ y: 280 }}
              pagination={false}
              bordered
            />
          </div>
        </div>
        <div className={styles.groupStatus}>
          <div className={styles.groupInspectionTitle}>Group Inspection</div>
          <div className={styles.groupMeasures}>
            <Badge status="success" />
            {'rNN (non-protected group): ' +
              Math.round(rNNSumNonProtectedGroup * 100) / 100}
          </div>
          <div className={styles.groupMeasures}>
            <Badge status="success" />
            {'rNN (protected group): ' +
              Math.round(rNNSumProtectedGroup * 100) / 100}
          </div>
          <div className={styles.instanceDataTableWrapper}>
            <Table
              className={styles.groupDataTable}
              columns={columnsForGroup}
              dataSource={this.renderGroupFeatureTable()}
              scroll={{ y: 80 }}
              pagination={false}
              bordered
            />
          </div>
        </div>
      </div>
    );
  }
}

export default LocalInspectionView;
