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
    svg.setAttribute('height', '50px');
    svg.setAttribute('0 0 200 200');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('transform', 'translate(0,10)');

    const measureScale = d3.scaleLinear()
        .domain(measureDomain)
        .range([0, 60]);

    const g = d3.select(svg).append('g')
        .attr('transform', 'translate(3,0)');

    const xAxisSetting = d3.axisBottom(measureScale)
            .tickValues(measureDomain).tickSize(0),
          xAxis = d3.select(svg).append('g')
            .call(xAxisSetting)
            .attr('class', 'measure_x_axis')
            .attr('transform', 'translate(7,' + 23 + ')');

    xAxis.select('.domain').remove();

    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 70)
      .attr('height', 20)
      .style('fill', '#efefef');

    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', measureScale(measure))
      .attr('height', 20)
      .style('fill', color);

    const avgCircle = g.append('circle')
      .attr('cx', measureScale(0.5))
      .attr('cy', 0 + 10)
      .attr('r', 3)
      .style('fill', 'black')
      .style('fill-opacity', 0.5)
      .style('stroke', 'black');

    const perfectLine = g.append('line')
        .attr('x1', 70)
        .attr('y1', 0)
        .attr('x2', 70)
        .attr('y2', 20)
        .style('stroke', '#c91765')
        .style('stroke-width', 2);

    const perfectRect = g.append('rect')
        .attr('width', 3)
        .attr('height', 3)
        .style('fill', '#c91765')
        .style('stroke', '#c91765')
        .attr('transform', 'translate(70,20)rotate(45)');

    g.append('text')
      .attr('x', 60 + 15)
      .attr('y', 15)
      .style('font-size', 16)
      .text(measure);

    return (
      <div className={styles.measure}>
        {svg.toReact()}
      </div>
    );
  }
}

export default UtilityBar;
