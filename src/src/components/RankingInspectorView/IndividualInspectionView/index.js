import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table, Icon, Badge } from 'antd';

import styles from './styles.scss';
import index from '../../../index.css';
import gs from '../../../config/_variables.scss'; // gs (=global style)

class IndividualInspectionView extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    renderFeatureTable() {
      const _self = this;
      const { selectedInstance } = this.props;
  
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
          feature: <div></div>,
          value: ''
        }
      ]
    }

    render() {
      console.log('IndividualInspectionView rendered');
      const { selectedInstance } = this.props;
  
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
                <span className={index.instanceIdTitle}>Instance ID:&nbsp;</span>
                {(selectedInstance && Object.keys(selectedInstance).length !== 0) ? selectedInstance.idx : ''}
              </div>
              <div className={styles.individualMeasures}>{'rNN: ' + Math.round(this.props.xNN * 100) / 100}</div>
              <div className={styles.instanceDataTableWrapper}>
                <Table
                  className={styles.instanceDataTable}
                  columns={columns} 
                  dataSource={ (selectedInstance && Object.keys(selectedInstance).length !== 0) ? this.renderFeatureTable() : this.renderEmptyTable() } 
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