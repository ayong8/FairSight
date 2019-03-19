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
        this.state = {
        };
    }

    renderIndividualFeatureTable() {
      const _self = this;
      const { selectedInstance, selectedInstanceNNs } = this.props,
            nSelectedInstanceNNs = selectedInstanceNNs.length;
  
      return Object.keys(selectedInstance.features).map((feature, idx) => {
        return {
          feature: feature.replace(/_/g, ' '),
          individualValue: selectedInstance.features[feature],
          neighborsValue: _.sum(selectedInstanceNNs.map((d) => d.x2.features[feature])) / nSelectedInstanceNNs
        };
      });
    }

    renderIndividualEmptyTable() {
      const { features } = this.props;

      return features.map((d) => {
        return  {
          feature: d.name,
          individualValue: '',
          neighborsValues: ''
        }
      });
    }

    renderGroupFeatureTable() {
      const _self = this;
      const { instances } = this.props.rankingInstance,
            nonProtectedGroup = instances.filter((d) => d.group === 0),
            protectedGroup = instances.filter((d) => d.group === 1),
            nNonProtectedGroup = nonProtectedGroup.length,
            nProtectedGroup = protectedGroup.length;

      return Object.keys(instances[0].features).map((feature, idx) => {
        return {
          feature: feature.replace(/_/g, ' '),
          nonProtectedGroupValue: _.sum(nonProtectedGroup.map((d) => d.features[feature])) / nNonProtectedGroup,
          protectedGroupValue: _.sum(protectedGroup.map((d) => d.features[feature])) / nProtectedGroup
        };
      });
    }

    render() {
      console.log('LocalInspectionView rendered');
      const { selectedInstance, rankingInstance,
              rNN, rNNGain } = this.props,
            { instances, sensitiveAttr, stat } = rankingInstance,
            { rNNSum, rNNSumNonProtectedGroup, rNNSumProtectedGroup } = stat,
            { protectedGroup, nonProtectedGroup } = sensitiveAttr,
            featureNames = Object.keys(instances[0].features);
  
      const columnsForIndividual = [
        { title: 'Feature', dataIndex: 'feature', width: '50%' },
        { title: 'Individual', dataIndex: 'individualValue', width: '25%'},
        { title: 'Neighbors', dataIndex: 'neighborsValue', width: '25%'}
      ];

      const columnsForGroup = [
        { title: 'Feature', dataIndex: 'feature', width: '50%' },
        { title: 'Non-protected', dataIndex: 'nonProtectedGroupValue', width: '25%'},
        { title: 'Protected', dataIndex: 'protectedGroupValue', width: '25%'}
      ];

      return (
        <div className={styles.LocalInspectionView}>
          <div className={index.title + ' ' + styles.localInspectorTitle}>Local Inspector</div>
          <div className={styles.IndividualStatus}>
            <div className={styles.individualInspectionTitle}>Individual Inspection</div>
            {/* <Icon type="user" style={{ fontSize: 50, backgroundColor: 'white', border: '1px solid grey', marginBottom: 10}}/> */}
            <div>
              <Badge status="success"/>
              <span className={index.instanceIdTitle}>Instance ID:&nbsp;</span>
              {(selectedInstance && Object.keys(selectedInstance).length !== 0) ? selectedInstance.idx : ''}
            </div>
            <div className={styles.individualMeasures}>
              <Badge status="success"/>
              {'Ranking: ' + selectedInstance.ranking}
            </div>
            <div className={styles.individualMeasures}>
              <Badge status="success"/>
              {'rNN: ' + Math.round(rNN * 100) / 100}
            </div>
            <div className={styles.individualMeasures}>
              <Badge status="success"/>
              {'rNN (gain): ' + Math.round(rNNGain * 100) / 100}
            </div>
            <div className={styles.instanceDataTableWrapper}>
              <Table
                className={styles.instanceDataTable}
                columns={columnsForIndividual} 
                dataSource={ (selectedInstance && Object.keys(selectedInstance).length !== 0) ? this.renderIndividualFeatureTable() : this.renderIndividualEmptyTable() } 
                scroll={{ y: 120 }}
                pagination={false}
                bordered
              />
            </div>
          </div>
          <div className={styles.groupStatus}>
            <div className={styles.groupInspectionTitle}>Group Inspection</div>
            <div className={styles.groupMeasures}>
              <Badge status="success"/>
              {'rNN (non-protected group): ' + Math.round(rNNSumNonProtectedGroup * 100) / 100}
            </div>
            <div className={styles.groupMeasures}>
              <Badge status="success"/>
              {'rNN (protected group): ' + Math.round(rNNSumProtectedGroup * 100) / 100}
            </div>
            <div className={styles.instanceDataTableWrapper}>
              <Table
                className={styles.groupDataTable}
                columns={columnsForGroup} 
                dataSource={ this.renderGroupFeatureTable() } 
                scroll={{ y: 120 }}
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