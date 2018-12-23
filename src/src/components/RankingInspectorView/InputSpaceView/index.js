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
      // if (this.props.selectedInstance !== nextProps.selectedInstance) {
      //   if (Object.keys(nextProps.selectedInstance).length !== 0) {
      //     d3.selectAll('.selected2').style('stroke-width', 1).classed('selected2', false);
      //     d3.selectAll('.circle_input2_' + nextProps.selectedInstance.idx).style('stroke-width', 2).classed('selected2', true);
      //   }
      // }

      // console.log('qqqq: ', nextProps.selectedInstanceNNs);
      // if (this.props.seletedInstanceNNs !== nextProps.selectedInstanceNNs) {
      //     nextProps.selectedInstanceNNs.forEach((selectedInstanceNN) => {
      //     d3.selectAll('.neighbor2').attr('r', 4).style('stroke-width', 1).classed('neighbor2', false);
      //     d3.selectAll('.circle_input2_' + selectedInstanceNN.idx2).style('r', 6).style('stroke-width', 2).classed('neighbor2', true);
      //   });
      // }
      // selectedInstanceNNs.forEach((selectedInstanceNN) => { // For nearest neighbors
      //   d3.select('.circle_input2_' + selectedInstanceNN.idx).style('stroke', 'red');
      // });
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
      const { mode, inputCoords, topk, selectedInstanceNNs} = this.props;
      const wholeInstances = _.toArray(inputCoords),
            instances = wholeInstances.slice(0, 100);

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
          .selectAll('.circle_input2')
          .data(instances)
          .enter().append('circle')
          .attr('class', (d) => 'circle_input2 circle_input2_' + d.idx)
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
          .style('stroke', 'black')
          .style('opacity', 0.7)
          .on('mouseover', function(d) {
            _self.props.onSelectedInstance(d.idx);
          })
          .on('mouseout', function(d) {
            _self.props.onUnselectedInstance();
          });

      const circlesForPattern = gCircles
          .selectAll('.circle_input')
          .data(instances)
          .enter().append('circle')
          .attr('class', (d) => 'circle_input circle_input_' + d.idx)
          .attr('cx', (d) => xScale(d.dim1))
          .attr('cy', (d) => yScale(d.dim2))
          .attr('r', 4)
          .style('fill', (d) => !d.target ? 'url(#diagonalHatch)': 'none')
          .style('stroke', 'black')
          .style('opacity', 0.7)
          .on('mouseover', function(d) {
            console.log('inputed circleeeeee: ', d);
            // d3.select('.circle_input_' + d.idx).style('stroke-width', 2);
            _self.props.onSelectedInstance(d.idx);
            console.log(selectedInstanceNNs);
            selectedInstanceNNs.forEach((selectedInstanceNN) => { // For nearest neighbors
              d3.select('.circle_input_' + selectedInstanceNN.idx).style('stroke', 'red');
            });
          })
          .on('mouseout', function(d) {
            // d3.select('.circle_input_' + d.idx).style('stroke-width', 0.5);
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