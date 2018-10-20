import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';

import styles from "./styles.scss";
import index from "../../../index.css";
import gs from "../../../config/_variables.scss"; // gs (=global style)

class LegendView extends Component {
  constructor(props) {
    super(props);

    this.layout = {
      svg: {
        width: 210,
        height: 160,
        padding: 10
      },
      fontSize: 12,
      fontColor: '#5b5b5b',
      borderColor: '#5b5b5b'
    }
  }

  render() {
    const _self = this;
    const { mode } = this.props;

    const svgIndividualFairness = new ReactFauxDOM.Element('svg');
    svgIndividualFairness.setAttribute('width', _self.layout.svg.width);
    svgIndividualFairness.setAttribute('height', _self.layout.svg.height);
    svgIndividualFairness.setAttribute('0 0 200 200');
    svgIndividualFairness.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    const gLegendIndividualFairness = d3.select(svgIndividualFairness).append('g')
            .attr('class', 'g_legend')
            .attr('transform', 'translate(0, 0)');

    const pairColorScale = d3.scaleThreshold()
        .domain([1, 2, 3, 4])  // pair is one or two or three
        .range(['white', gs.groupColor1, gs.groupColor2, gs.betweenGroupColor, gs.withinGroupColor]);   

    // legend border
    // gLegendIndividualFairness.append('rect')
    //     .attr('class', 'legend')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', this.layout.svg.width - this.layout.svg.padding)
    //     .attr('height', this.layout.svg.height)
    //     .style('fill', '#f7f7f7')
    //     .style('shape-rendering','crispEdges')
    //     .style('stroke', '#d9d9d9')
    //     .style('stroke-width', 1.0)
    //     .style('opacity', 0.5);

    // Pair (node)
    gLegendIndividualFairness.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .text('Individuals')
        .style('font-size', this.layout.fontSize);

    // Individuals
    // Man
    gLegendIndividualFairness.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 20)
        .attr('cy', 30)
        .attr('r', 4)
        .style('fill', gs.groupColor1)
        .style('stroke', 'gray');
    gLegendIndividualFairness.append('text')
        .attr('x', 30)
        .attr('y', 33)
        .text('Man')
        .style('font-size', this.layout.fontSize)
        .style('fill', this.layout.fontColor);
    // Woman
    gLegendIndividualFairness.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 20)
        .attr('cy', 45)
        .attr('r', 4)
        .style('fill', gs.groupColor2)
        .style('stroke', 'lightgray');
    gLegendIndividualFairness.append('text')
        .attr('x', 30)
        .attr('y', 48)
        .text('Woman')
        .style('font-size', this.layout.fontSize)
        .style('color', '#5b5b5b');

    // Pairs
    gLegendIndividualFairness.append('text')
        .attr('x', 5)
        .attr('y', 65)
        .text('Pairs (Absolute distortion)')
        .style('font-size', this.layout.fontSize);

    // Pair color scales
    gLegendIndividualFairness.append('text')
        .attr('x', 10)
        .attr('y', 82)
        .text('low')
        .style('font-size', this.layout.fontSize);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 35)
        .attr('y', 75)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'white')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 47)
        .attr('y', 75)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'lavender')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 59)
        .attr('y', 75)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'indigo')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('text')
        .attr('x', 75)
        .attr('y', 82)
        .text('high')
        .style('font-size', this.layout.fontSize);

    // within-group pair colors
    gLegendIndividualFairness.append('text')
        .attr('x', 10)
        .attr('y', 100)
        .text('Within-group pairs')
        .style('font-size', this.layout.fontSize);

    gLegendIndividualFairness.append('text')
        .attr('x', 15)
        .attr('y', 115)
        .text('low')
        .style('font-size', this.layout.fontSize);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 40)
        .attr('y', 108)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'white')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 52)
        .attr('y', 108)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'lightpink')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 65)
        .attr('y', 108)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'hotpink')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('text')
        .attr('x', 80)
        .attr('y', 115)
        .text('high')
        .style('font-size', this.layout.fontSize);

    // Between-group pairs
    gLegendIndividualFairness.append('text')
        .attr('x', 10)
        .attr('y', 130)
        .text('Between-group pairs')
        .style('font-size', this.layout.fontSize);

    gLegendIndividualFairness.append('text')
        .attr('x', 15)
        .attr('y', 147)
        .text('low')
        .style('font-size', this.layout.fontSize);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 40)
        .attr('y', 139)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'white')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 52)
        .attr('y', 139)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', '#d4ffd4')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 65)
        .attr('y', 139)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'lightgreen')
        .style('stroke', this.layout.borderColor);

    gLegendIndividualFairness.append('text')
        .attr('x', 80)
        .attr('y', 147)
        .text('high')
        .style('font-size', this.layout.fontSize);


    const svgGroupFairness = new ReactFauxDOM.Element('svg');
    svgGroupFairness.setAttribute('width', _self.layout.svg.width);
    svgGroupFairness.setAttribute('height', _self.layout.svg.height);
    svgGroupFairness.setAttribute('0 0 200 200');
    svgGroupFairness.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    const gLegendGroupFairness = d3.select(svgGroupFairness).append('g')
            .attr('class', 'g_legend')
            .attr('transform', 'translate(0, 0)');

    // legend border
    // gLegendGroupFairness.append('rect')
    //     .attr('class', 'legend')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', this.layout.svg.width - this.layout.svg.padding)
    //     .attr('height', this.layout.svg.height)
    //     .style('fill', '#f7f7f7')
    //     .style('shape-rendering','crispEdges')
    //     .style('stroke', '#d9d9d9')
    //     .style('stroke-width', 1.0)
    //     .style('opacity', 0.5);

    // Pair (node)
    gLegendGroupFairness.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .text('Individuals')
        .style('font-size', this.layout.fontSize);

    // Individuals
    // Man
    gLegendGroupFairness.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 20)
        .attr('cy', 30)
        .attr('r', 4)
        .style('fill', gs.groupColor1)
        .style('stroke', 'gray');
    gLegendGroupFairness.append('text')
        .attr('x', 30)
        .attr('y', 33)
        .text('Man')
        .style('font-size', this.layout.fontSize)
        .style('fill', this.layout.fontColor);
    // Woman
    gLegendGroupFairness.append('circle')
        .attr('class', 'legend_rect')
        .attr('cx', 20)
        .attr('cy', 45)
        .attr('r', 4)
        .style('fill', gs.groupColor2)
        .style('stroke', 'lightgray');
    gLegendGroupFairness.append('text')
        .attr('x', 30)
        .attr('y', 48)
        .text('Woman')
        .style('font-size', this.layout.fontSize)
        .style('color', '#5b5b5b');

    // Pairs
    gLegendGroupFairness.append('text')
        .attr('x', 5)
        .attr('y', 65)
        .text('Pairs (Absolute distortion)')
        .style('font-size', this.layout.fontSize);

    // Pair color scales
    gLegendGroupFairness.append('text')
        .attr('x', 10)
        .attr('y', 82)
        .text('low')
        .style('font-size', this.layout.fontSize);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 35)
        .attr('y', 75)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'white')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 47)
        .attr('y', 75)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'lavender')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 59)
        .attr('y', 75)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'indigo')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('text')
        .attr('x', 75)
        .attr('y', 82)
        .text('high')
        .style('font-size', this.layout.fontSize);

    // within-group pair colors
    gLegendGroupFairness.append('text')
        .attr('x', 10)
        .attr('y', 100)
        .text('Within-group pairs')
        .style('font-size', this.layout.fontSize);

    gLegendGroupFairness.append('text')
        .attr('x', 15)
        .attr('y', 115)
        .text('low')
        .style('font-size', this.layout.fontSize);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 40)
        .attr('y', 108)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'white')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 52)
        .attr('y', 108)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'lightpink')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 65)
        .attr('y', 108)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'hotpink')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('text')
        .attr('x', 80)
        .attr('y', 115)
        .text('high')
        .style('font-size', this.layout.fontSize);

    // Between-group pairs
    gLegendGroupFairness.append('text')
        .attr('x', 10)
        .attr('y', 130)
        .text('Between-group pairs')
        .style('font-size', this.layout.fontSize);

    gLegendGroupFairness.append('text')
        .attr('x', 15)
        .attr('y', 147)
        .text('low')
        .style('font-size', this.layout.fontSize);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 40)
        .attr('y', 139)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'white')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 52)
        .attr('y', 139)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', '#d4ffd4')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('rect')
        .attr('class', 'legend_rect')
        .attr('x', 65)
        .attr('y', 139)
        .attr('width', 8)
        .attr('height', 8)
        .style('fill', 'lightgreen')
        .style('stroke', this.layout.borderColor);

    gLegendGroupFairness.append('text')
        .attr('x', 80)
        .attr('y', 147)
        .text('high')
        .style('font-size', this.layout.fontSize);

    return (
      <div className={styles.LegendView}>
        {mode === 'groupFairness' ? svgGroupFairness.toReact() : svgIndividualFairness.toReact()}
      </div>
    );
  }
}

export default LegendView;
