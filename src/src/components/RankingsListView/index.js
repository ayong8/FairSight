import React, { Component } from "react";
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import _ from 'lodash';
import { Table, Tag, Icon } from 'antd';

import styles from "./styles.scss";
import index from "../../index.css";
import gs from "../../config/_variables.scss"; // gs (=global style)

import FairnessBar from "../FairnessBar";
import UtilityBar from "../UtilityBar";

class RankingsListView extends Component {
  constructor(props) {
    super(props);

    this.layout = {
      rankingPlot: {
        width: 300,
        height: 300,
        svg: {
          width: 250,
          height: 300,
          margin: 25
        },
        plot: {
          width: 280,
          height: 250,
          margin: 20,
          marginTop: 10,
          marginLeft: 40,
          marginBottom: 20
        }
      }
    }

    this.renderRankingInstances = this.renderRankingInstances.bind(this);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (this.props.rankings !== nextProps.rankings) { return true; }

  //   return false;
  // }

  renderRankingPlot() {
    const _self = this;
    const { rankings } = this.props;

    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', _self.layout.rankingPlot.svg.height);
    svg.setAttribute('class', 'svg_ranking_plot');

    // x and y axis and scale
    const xFairnessScale = d3.scaleLinear()
            .domain([0, 2])
            .range([0, _self.layout.rankingPlot.plot.width]),
          yUtilityScale = d3.scaleLinear()
            .domain([0, 100])
            .range([_self.layout.rankingPlot.plot.height, 0]);

    const r = 7;
    const backgroundRect = d3.select(svg)
            .append('rect')
            .attr('x', _self.layout.rankingPlot.plot.marginLeft)
            .attr('y', _self.layout.rankingPlot.plot.marginTop)
            .attr('width', _self.layout.rankingPlot.plot.width)
            .attr('height', _self.layout.rankingPlot.plot.height)
            .style('fill', 'whitesmoke');

    const xFairnessAxis = d3.select(svg).append('g')
            .attr('class', 'g_x_fairness_axis')
            .attr('transform', 'translate(' + _self.layout.rankingPlot.plot.marginLeft + ',' + (_self.layout.rankingPlot.plot.marginTop + _self.layout.rankingPlot.plot.height) + ')')
            .call(d3.axisBottom(xFairnessScale).ticks(5)),
          yUtilityAxis = d3.select(svg).append('g')
            .attr('class', 'g_y_utility_axis')
            .attr('transform', 'translate(' + _self.layout.rankingPlot.plot.marginLeft + ',' + _self.layout.rankingPlot.plot.marginTop + ')')
            .call(d3.axisLeft(yUtilityScale).ticks(5).tickFormat((d) => d + '%'));

    const xFairnessLegend = d3.select(svg)
            .append('text')
            .attr('x', _self.layout.rankingPlot.width - 20)
            .attr('y', _self.layout.rankingPlot.svg.height - 10)
            .text('Fairness');

    const yUtilityLegend = d3.select(svg)
            .append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text('Fairness');

    const gRankings = d3.select(svg)
            .selectAll('.g_ranking')
            .data(rankings).enter()
            .append('g')
            .attr('class', 'g_ranking')
            .attr('transform', 'translate(' + _self.layout.rankingPlot.plot.marginLeft + ',' + _self.layout.rankingPlot.plot.marginTop + ')');
    
    gRankings.append('circle')
        .attr('class', 'ranking_circle')
        .attr('cx', (d) => xFairnessScale(d.stat.GFDCG))
        .attr('cy', (d) => yUtilityScale(d.stat.rNNSum * 100))
        .attr('r', r)
        .style('fill', 'darkgray')
        .style('stroke', 'none');

    gRankings.append('text')
        .attr('class', 'ranking_id')
        .attr('x', (d) => xFairnessScale(d.stat.GFDCG) - r/2 - 0.5)
        .attr('y', (d) => yUtilityScale(d.stat.rNNSum * 100) + r/2 + 1)
        .style('fill', 'white')
        .text((d) => d.rankingId);

    return (
      <div>
        {svg.toReact()}
      </div>
    )
  }

  renderRankingInstances() {
    const dataRankings = this.props.rankings;

    return _.map(dataRankings, (rankingInstance, idx) => {
      const { rankingId, currentTopk, instances, method, stat } = rankingInstance;

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

      return {
        id: 'R' + rankingId,
        topk: currentTopk,
        if: 
        <div className={styles.featureRow}>
          <UtilityBar 
            measure={stat.rNNSum}
            measureDomain={[0, 1]}
            color={gs.utilityColor}
          />
        </div>,
        gf: 
        <div className={styles.featureRow}>
            <FairnessBar 
              measure={stat.GFDCG}
              measureDomain={[0, 2]}
              color={gs.fairnessColor}
            />
        </div>,
        u: 
        <div>
          <UtilityBar 
            measure={stat.utility}
            measureDomain={[0, 1]}
            color={gs.utilityColor}
          />
        </div>
      }
    });
  }

  render() {
    const _self = this;
    console.log('RankingListView rendered');
    if ((!this.props.rankings || this.props.rankings.length === 0)) {
        return <div />
      }

    const rankingListColumns = [
        { title: 'ID', dataIndex: 'id', width: '5%' },
        { title: 'TOPK', dataIndex: 'topk', width: '10%' },
        { title: 'GF', dataIndex: 'gf', width: '25%'},
        { title: 'IF', dataIndex: 'if', width: '25%'},
        { title: 'U', dataIndex: 'u', width: '25%'}
      ];

    return (
      <div className={styles.RankingsListView}>
        <div className={styles.titleWrapper}>
          <div className={index.title + ' ' + styles.title }> Rankings </div>
        </div>
        {/* {this.renderRankingPlot()} */}
        <Table
          className={styles.rankingComparisonTable}
          columns={rankingListColumns} 
          dataSource={this.renderRankingInstances()} 
          scroll={{ y: 400 }}
          pagination={false}
        />
      </div>
    );
  }
}

export default RankingsListView;
