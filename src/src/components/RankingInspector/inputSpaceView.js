import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactFauxDOM from 'react-faux-dom';
import { Table } from 'reactstrap';
import { Slider, Button, Tag } from "@blueprintjs/core";

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

class InputSpaceView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value2: 2.5
        };

    }

    getChangeHandler(key) {
        return (value) => this.setState({ [key]: value });
    }

    renderFeatureTable() {
        const svgFeatureTable = new ReactFauxDOM.Element('svg');

        svgFeatureTable.setAttribute('width', '95%');
        svgFeatureTable.setAttribute('height', '300px')
        svgFeatureTable.setAttribute('class', 'svg_input_space');
        svgFeatureTable.style.setProperty('margin', '0 10px');
        svgFeatureTable.style.setProperty('background-color', '#f7f7f7');
        svgFeatureTable.style.setProperty('border', '1px solid #dfdfdf');

        d3.select(svgFeatureTable)
    }

    renderSelectedInstance() {
      let data = this.props.data,
          selectedInstanceIdx = this.props.selectedInstance,
          selectedInstance = data.filter((d) => d.idx === selectedInstanceIdx)[0];

      let featureValueDivs = Object.keys(selectedInstance.x).map((key) => {
                return <div>&nbsp;&nbsp;{key + ': ' + selectedInstance.x[key]}</div>;
              });

      return (
        <div>
          <div>Index:&nbsp;{selectedInstanceIdx}</div>
          <div><b>Features</b></div>
          <div>{featureValueDivs}</div>
        </div>
      );
    }

    render() {
        const _self = this,
              data = _.toArray(this.props.inputCoords);

        const svg = new ReactFauxDOM.Element('svg');

        svg.setAttribute('width', '60%');
        svg.setAttribute('height', '250px')
        svg.setAttribute('class', 'svg_input_space');
        svg.style.setProperty('margin', '0 10px');
        svg.style.setProperty('background-color', '#f7f7f7');
        svg.style.setProperty('border', '1px solid #dfdfdf');

        let xScale = d3.scaleLinear()
            .domain(d3.extent(data, (d) => d.dim1))
            .range([0, 220]);

        let yScale = d3.scaleLinear()
            .domain(d3.extent(data, (d) => d.dim2))
            .range([230, 0]);

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
                let group = d.group;
                return group === 1
                    ? gs.groupColor1
                    : gs.groupColor2;
            })
            .style('stroke', 'black')
            .style('opacity', 0.7)
            .on('mouseover', (d) => {
                _self.props.onMouseoverInstance(d.idx);
            });

        // Handle mouseover action
        circles
            .filter((d) => d.idx === this.props.selectedInstance)
            .style('stroke-width', 2);

        return (
          <div className={styles.InputSpaceView}>
            <div className={index.title}>Input space</div>
            <div className={styles.IndividualPlotStatusView}>
                {svg.toReact()}
                <div className={styles.IndividualStatus}>{this.renderSelectedInstance()}</div>
            </div>
            <div className={styles.FeatureTableView}>
              <div className={index.title}>Features</div>
              <Table borderless className={styles.FeatureTable}>
                <thead>
                  <tr>
                      <th>Features</th>
                      <th>Custom weight</th>
                      <th>Weight from model</th>
                  </tr>
                </thead>
                <tbody className={styles.FeatureTableTbody}>
                  <tr>
                    <td>Age</td>
                    <td>
                      <Slider
                          min={0}
                          max={10}
                          stepSize={0.1}
                          labelStepSize={10}
                          onChange={this.getChangeHandler("value2")}
                          value={3}
                      //vertical={vertical}
                      />
                    </td>
                    <td>
                      <Tag
                          key='+1.15'
                          //onRemove={removable && onRemove}
                          //icon={icon === true ? "home" : undefined}
                          //rightIcon={rightIcon === true ? "map" : undefined}
                          minimal={true}
                      >
                          {'+1.15'}
                      </Tag>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>
        );
    }

    handleErrorOpen = () => this.setState({ isOpenError: true });
}

export default InputSpaceView;