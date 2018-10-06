import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';

import styles from "./styles.scss";
import index from "../../index.css";
import gs from "../../config/_variables.scss"; // gs (=global style)

class LegendView extends Component {
  constructor(props) {
    super(props);

    this.layout = {
      svg: {
        width: 130,
        height: 150
      }
    }
  }

  render() {
    const _self = this;

    const svg = new ReactFauxDOM.Element('svg');
    svg.setAttribute('width', _self.layout.svg.width);
    svg.setAttribute('height', _self.layout.svg.height);
    svg.setAttribute('0 0 200 200');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.setProperty('margin', '30px 0px 5%');
    
    const gLegend = d3.select(svg).append('g')
            .attr('class', 'g_legend')
            .attr('transform', 'translate(0, 0)');

    const pairColorScale = d3.scaleThreshold()
        .domain([1, 2, 3, 4])  // pair is one or two or three
        .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor, gs.withinGroupColor]);   

    // legend border
    gLegend.append('rect')
        .attr('class', 'legend')
        .attr('x', 3)
        .attr('y', 3)
        .attr('width', 120)
        .attr('height', 70)
        .style('fill', 'none')
        .style('shape-rendering','crispEdges')
        .style('stroke', '#2a4b5b')
        .style('stroke-width', 1.0)
        .style('opacity', 0.5);
    // Pair (node)
    gLegend.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .text('Pairwise distortion')
        .style('font-size', '11px');

    // Woman-Man pair
    gLegend.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 10)
        .attr('cy', 30)
        .attr('r', 4)
        .style('fill', pairColorScale(3))
        .style('stroke', d3.rgb(pairColorScale(3)).darker());
    gLegend.append('text')
        .attr('x', 30)
        .attr('y', 33)
        .text('Woman-Man')
        .style('font-size', '11px');
    // Man-Man pair
    gLegend.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 10)
        .attr('cy', 45)
        .attr('r', 4)
        .style('fill', pairColorScale(1))
        .style('stroke', d3.rgb(pairColorScale(1)).darker());
    gLegend.append('text')
        .attr('x', 30)
        .attr('y', 48)
        .text('Man-Man')
        .style('font-size', '11px');  

    // Woman-Woman pair
    gLegend.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 10)
        .attr('cy', 60)
        .attr('r', 4)
        .style('fill', pairColorScale(2))
        .style('stroke', d3.rgb(pairColorScale(2)).darker());

    gLegend.append('text')
        .attr('x', 30)
        .attr('y', 63)
        .text('Woman-Woman')
        .style('font-size', '11px'); 

    return (
      <div className={styles.LegendView}>
        {svg.toReact()}
      </div>
    );
  }
}

export default LegendView;
