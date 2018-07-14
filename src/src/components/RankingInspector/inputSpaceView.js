import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import dimReductionData from '../../data/dim_reduction_result.json';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)



class InputSpaceView extends Component {
    constructor(props) {
      super(props);
    }

    render() {
        console.log(dimReductionData);
        return (
            <div>11111
            </div>
        );
    }
}

export default InputSpaceView;