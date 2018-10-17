import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';
import { Table } from 'reactstrap';
import { Tag, Icon } from 'antd';

import styles from "./styles.scss";
import index from "../../index.css";
import gs from "../../config/_variables.scss"; // gs (=global style)

const _attr = {
}

class RankingsListView extends Component {
  constructor(props) {
    super(props);

    this.renderRankingInstances = this.renderRankingInstances.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.rankings !== nextProps.rankings) { return true; }

    return false;
  }

  renderRankingInstances() {
    const dataRankings = this.props.rankings;

    return _.map(dataRankings, (ranking, idx) => {
      const { rankingId, instances, method, stat } = ranking;

      const svg = new ReactFauxDOM.Element('svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('class', 'svg_ranking_list');
  
      let xScale = d3.scaleBand()
              .domain(d3.range(20))
              .range([0, 100]);
        
      const groupColorScale = d3.scaleOrdinal()
              .range([gs.groupColor1, gs.groupColor2])
              .domain([1, 2]);
  
      const gRanking = d3.select(svg)
            .selectAll('.instance')
            .data(instances)
            .enter().append('rect')
            .attr('class', 'instance')
            .attr('x', function(e, i) {
              return 15 * (i+1);
            })
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', 20)
            .style('fill', function(e) {
              return groupColorScale(e.group);
            })
            .style('stroke', 'black')
            .style('shape-rendering', 'crispEdge')
            .style('stroke-width', 0.3);

      return ( <tr key={idx}>
                <td>{'R' + rankingId}</td>
                <td></td>
                <td>{stat.accuracy}</td>
                <td>{stat.goodnessOfFairness}</td>
                <td>{stat.groupSkew}</td>
                <td>{stat.sp}</td>
              </tr> 
          );
    });
  }

  renderTradeoffPlot() {
    // if (!this.props.data || this.props.data.length === 0) {
    //   return <div />
    // }

    // const _self = this,
    //       wholeInstances = _.toArray(this.props.inputCoords),
    //       instances = wholeInstances.slice(0, 100);

    // const svg = new ReactFauxDOM.Element('svg');

    // svg.setAttribute('width', this.layout.svg.width);
    // svg.setAttribute('height', this.layout.svg.height)
    // svg.setAttribute('class', 'svg_input_space');
    // svg.style.setProperty('border', '1px solid #d9d9d9');

    // let xScale = d3.scaleLinear()
    //     .domain(d3.extent(instances, (d) => d.dim1))
    //     .range([0, this.layout.svg.width - this.layout.svg.padding]);

    // let yScale = d3.scaleLinear()
    //     .domain(d3.extent(instances, (d) => d.dim2))
    //     .range([this.layout.svg.height - this.layout.svg.padding, 0]);

    // let gCircles = d3.select(svg)
    //     .append('g')
    //     .attr('transform', 'translate(10,10)');

    // const circles = gCircles
    //     .selectAll('.item')
    //     .data(instances)
    //     .enter().append('circle')
    //     .attr('class', 'item')
    //     .attr('cx', (d) => xScale(d.dim1))
    //     .attr('cy', (d) => yScale(d.dim2))
    //     .attr('r', 3)
    //     .style('fill', (d) => {
    //         let group = d.group;
    //         return group === 0
    //             ? gs.groupColor1
    //             : gs.groupColor2;
    //     })
    //     .style('stroke', 'black')
    //     .style('opacity', 0.7)
    //     .on('mouseover', (d) => {
    //         // _self.props.onMouseoverInstance(d.idx);
    //     });

    // // Handle mouseover action
    // // circles
    // //     .filter((d) => d.idx === this.props.selectedRankingInterval)
    // //     .style('stroke-width', 2);

    // return (
    //   <div className={styles.InputSpaceView}>
    //     <div className={styles.inputSpaceViewTitleWrapper}>
    //       <div className={styles.inputSpaceViewTitle + ' ' + index.subTitle}>Input space</div>
    //     </div>
    //     <div className={styles.IndividualPlotStatusView}>
    //         {svg.toReact()}
    //     </div>
    //     {/* <div className={styles.FeatureTableView}>
    //       <div className={index.title}>Features</div>
    //       <Table borderless className={styles.FeatureTable}>
    //         <thead>
    //           <tr>
    //               <th>Features</th>
    //               <th>Custom weight</th>
    //               <th>Correlation with Sensitive attribute</th>
    //           </tr>
    //         </thead>
    //         <tbody className={styles.FeatureTableTbody}>
    //           {this.renderFeatures()}
    //         </tbody>
    //       </Table>
    //     </div> */}
    //   </div>
    // );
  }

  render() {
    console.log('RankingListView rendered');
    if ((!this.props.rankings || this.props.rankings.length === 0)) {
        return <div />
      }

    return (
      <div className={styles.RankingsListView}>
        <div className={styles.titleWrapper}>
          <div className={index.title + ' ' + styles.title }> Rankings </div>
        </div>
        <div className={styles.addRanking}>+</div>
        <div className={styles.rankingCondition}></div>
        <Table borderless className={styles.FeatureTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ranking</th>
              <th>ACC</th>
              <th>GD</th>
              <th>GS</th>
              <th>SP</th>
            </tr>
          </thead>
          <tbody className={styles.FeatureTableTbody}>
            {this.renderRankingInstances()}
          </tbody>
        </Table>
      </div>
    );
  }
}

export default RankingsListView;
