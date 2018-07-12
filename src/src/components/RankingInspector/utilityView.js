import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class UtilityView extends Component {
    constructor(props) {
      super(props);
    }
  
    render() {
      return (
        <div className={styles.UtilityView}>
          <div className={index.title}>Utility</div>
        </div>
      );
    }
  }

  export default UtilityView;