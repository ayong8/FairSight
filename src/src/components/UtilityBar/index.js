import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';
import { Table, Tag, Icon } from 'antd';

import styles from "./styles.scss";
import index from "../../index.css";
import gs from "../../config/_variables.scss"; // gs (=global style)

class UtilityBar extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log('MeasureView rendered');
    console.log(this.props);
    if ((!this.props.measure || this.props.measure.length === 0)) {
        return <div />
      }

    const { measure, measureDomain, color } = this.props;

    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('0 0 200 200');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('transform', 'translate(0,10)');

    const measureScale = d3.scaleLinear()
        .domain(measureDomain)
        .range([0, 60]);
    const xAxisSetting = d3.axisBottom(measureScale)
            .tickValues(measureDomain).tickSize(0),
          xAxis = d3.select(svg).append('g')
            .call(xAxisSetting)
            .attr('class', 'measure_x_axis')
            .attr('transform', 'translate(0,' + 20 + ')');

    xAxis.select('.domain').remove();

    d3.select(svg).append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 70)
      .attr('height', 20)
      .style('fill', '#efefef');

    d3.select(svg).append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', measureScale(measure))
      .attr('height', 20)
      .style('fill', color);

    d3.select(svg).append('text')
      .attr('x', 60 + 20)
      .attr('y', 15)
      .style('font-size', 17)
      .text(measure);

    return (
      <div className={styles.measure}>
        {svg.toReact()}
      </div>
    );
  }
}

export default UtilityBar;
