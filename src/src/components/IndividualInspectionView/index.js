import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table, Icon, Badge } from 'antd';

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
  
      return Object.keys(selectedInstance.features).map((feature, idx) => {
        return {
          feature: feature.replace(/_/g, ' '),
          value: selectedInstance.features[feature]
        };
      });
    }

    renderEmptyTable() {
      return [
        {
          feature: <div>ddd</div>,
          value: ''
        }
      ]
    }

    render() {
      console.log('IndividualInspectionView rendered');
      const { data, selectedInstance } = this.props,
            { instances } = data,
            selectedInstanceIdx = selectedInstance;
      
      const mouseoveredInstance = instances.filter((d) => d.idx === selectedInstance)[0];
  
      const columns = [
        { title: 'Feature', dataIndex: 'feature', width: '70%' },
        { title: 'Value', dataIndex: 'value', width: '30%'}
      ];

      return (
        <div className={styles.IndividualInspectionView}>
          <div className={index.subTitle}>Local Inspector</div>
          <div className={styles.IndividualStatus}>
            {/* <Icon type="user" style={{ fontSize: 50, backgroundColor: 'white', border: '1px solid grey', marginBottom: 10}}/> */}
            <div>
              <Badge status="success"/>
              <span className={index.instnaceIdTitle}>Instance ID:</span>
              1
            </div>
            <div className={styles.selectedRankingIntervalInfo}>
              <Table
                columns={columns} 
                dataSource={ typeof(selectedInstance) === 'undefined' ? this.renderEmptyTable() : this.renderFeatureTable() } 
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

export default IndividualInspectionView;