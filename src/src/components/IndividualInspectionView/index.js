import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table } from 'reactstrap';
import { Slider, Button, Tag } from "@blueprintjs/core";
import { Icon } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class IndividualInspectionView extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };

    }ㄴ

    render() {
      const { data, selectedInstance } = this.props,
            { instances } = data,
            selectedInstanceIdx = selectedInstance;
      
      const mouseoveredInstance = instances.filter((d) => d.idx === selectedInstance)[0];
  
      const featureValueDivs = Object.keys(mouseoveredInstance.features).map((key, idx) => {
                return <div key={idx}>&nbsp;&nbsp;{key + ': ' + mouseoveredInstance.features[key]}</div>;
              });

      return (
        <div className={styles.IndividualInspectionView}>
          <div className={index.subTitle}>Selected Instance</div>
          <div className={styles.IndividualStatus}>
            <Icon type="user" style={{ fontSize: 50, backgroundColor: 'white', border: '1px solid grey', margin: 5 }}/>
            <span>Index: 1</span>
            <div className={styles.selectedRankingIntervalInfo}>
              <div><b>Features</b></div>
              <div>{featureValueDivs}</div>
            </div>
          </div>
        </div>
      );
    }
}

export default IndividualInspectionView;