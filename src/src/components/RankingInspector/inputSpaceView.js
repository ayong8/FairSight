import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)



class InputSpaceView extends Component {
    constructor(props) {
      super(props);
    }

    render() {
        const data = _.toArray(this.props.inputCoords);
        console.log(data);

        // Set up the layout
        const svg = new ReactFauxDOM.Element('svg');
    
        svg.setAttribute('width', '90%');
        svg.setAttribute('height', '100%')
        svg.setAttribute('class', 'svg_inputspace');
        svg.style.setProperty('border-bottom', '1px solid lightgray');
        svg.style.setProperty('margin', '0 5%');

        let xScale = d3.scaleLinear()
                .domain(d3.extent(data, (d) => d.dim1))
                .range([0, 550]);

        let yScale = d3.scaleLinear()
                .domain(d3.extent(data, (d) => d.dim2))
                .range([200, 0]);

        let gCircles = d3.select(svg)
                .append('g')
                .attr('transform', 'translate(10,10)');

        const circles = gCircles
                .selectAll('.item')
                .data(data)
                .enter().append('circle')
                .attr('class', 'item')
                .attr('cx', (d) => xScale(d.dim1))
                .attr('cy', (d) => yScale(d.dim2))
                .attr('r', 3)
                .style('fill', (d) => {
                    let sex = d.sex.replace(" ", "")
                    
                    if(sex == 'female')
                        return gs.groupColor1;
                    else
                        return gs.groupColor2;
                })
                .style('opacity', 0.7);

        return (
            <div>
                {svg.toReact()}
            </div>
        );
    }
}

export default InputSpaceView;