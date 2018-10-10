import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table, Icon } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class IndividualInspectionView extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };

    }

    renderFeatureTable() {
      const _self = this;
      const { data, selectedInstance } = this.props,
            { instances } = data,
            selectedInstanceIdx = selectedInstance;
      
      const mouseoveredInstance = instances.filter((d) => d.idx === selectedInstance)[0];
  
      return Object.keys(mouseoveredInstance.features).map((feature, idx) => {
        return {
          feature: feature,
          value: mouseoveredInstance.features[feature]
        };
      });
    }

    renderEmptyTable() {
      return {
        feature: '',
        value: ''
      }
    }

    render() {
      console.log('IndividualInspectionView rendered');
      const { data, selectedInstance } = this.props,
            { instances } = data,
            selectedInstanceIdx = selectedInstance;
      
      const mouseoveredInstance = instances.filter((d) => d.idx === selectedInstance)[0];
  
      const columns = [
        { title: 'Feature', dataIndex: 'feature', width: 160 },
        { title: 'Value', dataIndex: 'value'}
      ];

      return (
        <div className={styles.IndividualInspectionView}>
          <div className={index.subTitle}>Selected Instance</div>
          <div className={styles.IndividualStatus}>
            <div className={styles.infoWrapper}>
              <Icon type="user" style={{ fontSize: 50, backgroundColor: 'white', border: '1px solid grey', marginBottom: 10}}/>
              <div>Index: 1</div>
              <div>Group</div>
              <div>Man</div>
            </div>
            <div className={styles.selectedRankingIntervalInfo}>
              <Table
                columns={columns} 
                dataSource={ typeof(selectedInstance) === 'undefined' ? this.renderEmptyTable() : this.renderFeatureTable() } 
                scroll={{ y: 150 }}
                pagination={false}
              />
            </div>
          </div>
        </div>
      );
    }
}

export default IndividualInspectionView;