import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table } from 'reactstrap';
import { Slider, Button, Tag } from "@blueprintjs/core";
import { Icon } from 'antd';

import styles from './styles.scss';
import index from '../../../index.css';
import gs from '../../../config/_variables.scss'; // gs (=global style)

class InputSpaceView extends Component {
    constructor(props) {
      super(props);
      this.state = {
          value2: 2.5
      };
      this.layout = {
        svg: {
          width: 250,
          height: 250,
          padding: 10
        }
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      const dataPropsChange = this.props.data !== nextProps.data;      
      const topkPropsChange = this.props.topk !== nextProps.topk;
      const inputCoordsPropsChange = this.props.inputCoords !== nextProps.inputCoords;
      const selectedInstancePropsChange = this.props.selectedInstance !== nextProps.selectedInstance;
      const selectedInstancesPropsChange = this.props.selectedInstances !== nextProps.selectedInstances;
  
      return dataPropsChange || topkPropsChange || 
             inputCoordsPropsChange || selectedInstancePropsChange ||
             selectedInstancesPropsChange;
    }

    componentWillUpdate(nextProps, nextState) {
      if (this.props.seletedInstance !== nextProps.selectedInstance)  {
        if (Object.keys(nextProps.selectedInstance).length !== 0) {
          d3.selectAll('.circle_input.selected').style('stroke', d3.rgb(gs.groupColor1).darker()).style('stroke-width', 0.5).classed('selected', false);
          d3.selectAll('.circle_input_' + nextProps.selectedInstance.idx).style('stroke', 'black').style('stroke-width', 3).classed('selected', true);
        } else {
          d3.selectAll('.circle_input.selected').style('stroke', d3.rgb(gs.groupColor1).darker()).style('stroke-width', 0.5).classed('selected', false);
        }
      }

      if (this.props.seletedInstanceNNs !== nextProps.selectedInstanceNNs) {
        let classesForNNs = '';
        nextProps.selectedInstanceNNs.forEach((selectedInstanceNN) => {
          classesForNNs += '.circle_input_' + selectedInstanceNN.idx2 + ',';
        });
        
        classesForNNs = classesForNNs.replace(/,\s*$/, '');
        d3.selectAll('.circle_input.neighbor').style('stroke', 'black').style('stroke-width', 0.5).classed('neighbor', false);
        if (classesForNNs !== '') {
          d3.selectAll(classesForNNs).style('stroke', 'blue').style('stroke-width', 2).classed('neighbor', true);
        }
      }
    }

    getChangeHandler(key) {
        return (value) => this.setState({ [key]: value });
    }

    renderFeatureTable() {
        const svgFeatureTable = new ReactFauxDOM.Element('svg');

        svgFeatureTable.setAttribute('width', '95%');
        svgFeatureTable.setAttribute('height', '80%')
        svgFeatureTable.setAttribute('class', 'svg_input_space');
        svgFeatureTable.style.setProperty('border', '1px solid #dfdfdf');

        d3.select(svgFeatureTable)
    }

    renderFeatures() {
        const data = this.props.data,
              features = data.features;

        return _.map(features, (feature) => 
                (<tr>
                  <td>{feature}</td>
                  <td>
                    <Slider
                        min={0}
                        max={3}
                        stepSize={0.1}
                        labelStepSize={10}
                        onChange={this.getChangeHandler("value2")}
                        value={1}
                    //vertical={vertical}
                    />
                  </td>
                  <td>
                    Correlation
                  </td>
                </tr>)
            );
    }

    render() {
      if (!this.props.data || this.props.data.length === 0) {
        return <div />
      }

      const _self = this;
      const { mode, data, inputCoords, topk, selectedInstanceNNs, selectedRankingInterval} = this.props;
      const wholeInstances = _.toArray(inputCoords),
            topkIdx = data.instances.map((d) => d.idx).slice(0, selectedRankingInterval.to),
            instances = wholeInstances.filter((d) => topkIdx.indexOf(d.idx) > -1).slice(0, selectedRankingInterval.to);

      const svg = new ReactFauxDOM.Element('svg');

      svg.setAttribute('width', this.layout.svg.width);
      svg.setAttribute('height', this.layout.svg.height)
      svg.setAttribute('class', 'svg_input_space');
      // svg.style.setProperty('border', '1px solid #d9d9d9');
      // svg.style.setProperty('backgroundColor', '#fbfbfb');

      let xScale = d3.scaleLinear()
          .domain(d3.extent(instances, (d) => d.dim1))
          .range([5, this.layout.svg.width - this.layout.svg.padding]);

      let yScale = d3.scaleLinear()
          .domain(d3.extent(instances, (d) => d.dim2))
          .range([this.layout.svg.height - this.layout.svg.padding, 5]);

      const diagonalPattern = d3.select(svg)
          .append('defs')
          .append('pattern')
            .attr('id', 'diagonalHatch')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4)
          .append('path')
            .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1);

      let gCircles = d3.select(svg)
          .append('g')
          .attr('transform', 'translate(0,0)');

      const circles = gCircles
          .selectAll('.circle_group')
          .data(instances)
          .enter().append('circle')
          .attr('class', (d) => 'circle_group circle_input circle_input_' + d.idx)
          .attr('cx', (d) => xScale(d.dim1))
          .attr('cy', (d) => yScale(d.dim2))
          .attr('r', 4)
          .style('fill', (d) => {
              if (mode === 'GF') {
                let group = d.group;
                return group === 0
                    ? gs.groupColor1
                    : gs.groupColor2;
              } else if (mode === 'IF') {
                //return d.isTopk ? gs.topkColor : gs.individualColor;
                return gs.individualColor;
              }
          })
          .style('stroke', (d) => {
            if (mode === 'GF') {
              let group = d.group;
              return group === 0
                  ? d3.rgb(gs.groupColor1).darker()
                  : d3.rgb(gs.groupColor2).darker();
            } else if (mode === 'IF') {
              //return d.isTopk ? gs.topkColor : gs.individualColor;
              return d3.rgb(gs.individualColor).darker();
            }
          })
          .style('opacity', 0.7)
          .on('mouseover', function(d) {
            _self.props.onSelectedInstance(d.idx);
          })
          .on('mouseout', function(d) {
            _self.props.onUnselectedInstance();
          });

      const circlesForPattern = gCircles
          .selectAll('.circle_target')
          .data(instances)
          .enter().append('circle')
          .attr('class', (d) => 'circle_target circle_input circle_input_' + d.idx)
          .attr('cx', (d) => xScale(d.dim1))
          .attr('cy', (d) => yScale(d.dim2))
          .attr('r', 4)
          .style('fill', (d) => (d.target === 0) ? 'none' : 'url(#diagonalHatch)')
          .style('stroke', 'none')
          .style('opacity', 0.7)
          .on('mouseover', function(d) {
            _self.props.onSelectedInstance(d.idx);
          })
          .on('mouseout', function(d) {
            _self.props.onUnselectedInstance();
          });

      return (
        <div className={styles.InputSpaceView}>
          {/* <div className={styles.inputSpaceViewTitleWrapper}>
            <div className={styles.inputSpaceViewTitle + ' ' + index.subTitle}>Input space</div>
          </div> */}
          <div className={styles.IndividualPlotStatusView}>
              {svg.toReact()}
          </div>
          {/* <div className={styles.FeatureTableView}>
            <div className={index.title}>Features</div>
            <Table borderless className={styles.FeatureTable}>
              <thead>
                <tr>
                    <th>Features</th>
                    <th>Custom weight</th>
                    <th>Correlation with Sensitive attribute</th>
                </tr>
              </thead>
              <tbody className={styles.FeatureTableTbody}>
                {this.renderFeatures()}
              </tbody>
            </Table>
          </div> */}
        </div>
      );
    }

    handleErrorOpen = () => this.setState({ isOpenError: true });
}

export default InputSpaceView;