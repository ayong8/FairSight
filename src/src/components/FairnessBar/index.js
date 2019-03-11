import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';
import { Table, Tag, Icon } from 'antd';

import styles from "./styles.scss";
import index from "../../index.css";
import gs from "../../config/_variables.scss"; // gs (=global style)

class FairnessBar extends Component {
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
        .attr('transform', 'translate(3,2)');
        
    const xAxisSetting = d3.axisBottom(measureScale)
            .tickValues(measureDomain).tickSize(0),
            xAxis = g.append('g')
            .call(xAxisSetting)
            .attr('class', 'measure_x_axis')
            .attr('transform', 'translate(5,' + 20 + ')');

    xAxis.select('.domain').remove();

    d3.select(svg).append('rect')
      .attr('x', 0)
      .attr('y', 5)
      .attr('width', 70)
      .attr('height', 10)
      .style('stroke', '#d0d0d0')
      .style('fill', '#efefef');

    const currentMeasure = d3.select(svg).append('line')
      .attr('x1', measureScale(measure))
      .attr('y1', 5)
      .attr('x2', measureScale(measure))
      .attr('y2', 15)
      .style('stroke', 'black');

    const avgCircle = g.append('circle')
            .attr('cx', measureScale(1.3))
            .attr('cy', 0 + 10)
            .attr('r', 3)
            .style('fill', 'white')
            .style('fill-opacity', 0.5)
            .style('stroke', 'white');

    const score = g.append('text')
            .attr('x', 60 + 15)
            .attr('y', 15)
            .style('font-size', 16)
            .text(measure);

    const fairLine = g.append('line')
            .attr('x1', 35)
            .attr('y1', 5)
            .attr('x2', 35)
            .attr('y2', 20)
            .style('stroke', '#c91765')
            .style('stroke-width', 2);

            const fairRect = g.append('rect')
            .attr('width', 3)
            .attr('height', 3)
            .style('fill', '#c91765')
            .style('stroke', '#c91765')
            .attr('transform', 'translate(35,15)rotate(45)');

    // Traingle-shaped indicator for current fair score
    var triangleSize = 20;
    var verticalTransform = 100 + Math.sqrt(triangleSize);
    const triangle = d3.symbol()
            .type(d3.symbolTriangle)
            .size(triangleSize);

    g.append('path')
      .attr('class', 'point_to_selected_instance')
      .attr("d", triangle)
      .attr("stroke", 'black')
      .attr("fill", 'black')
      .attr("transform", function(d) { return "translate(" + measureScale(measure) + "," + 3 + ")rotate(180)"; });

    return (
      <div className={styles.measure}>
        {svg.toReact()}
      </div>
    );
  }
}

export default FairnessBar;
