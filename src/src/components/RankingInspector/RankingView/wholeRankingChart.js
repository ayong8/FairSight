import React from 'react';
import * as d3 from 'd3';
import { Bar } from '@vx/shape';
import { genRandomNormalPoints } from '@vx/mock-data';
import { scaleLinear, scaleBand } from '@vx/scale';
import { Group } from '@vx/group';
import { AxisLeft, AxisBottom } from '@vx/axis';
import { BoxBrush, withBrush, getCoordsFromEvent, constrainToRegion } from '@vx/brush';
import { Motion, spring } from 'react-motion';

const points = genRandomNormalPoints();

class WholeRankingChart extends React.Component {
  constructor(props) {
    super(props);
    const { data, width, height, margin } = props;

    this.extent = {
      x0: margin.left,
      x1: width - margin.left,
      y0: margin.top,
      y1: height - margin.top
    };

    this.initialDomain = {
      x: d3.range(100),
      y: d3.extent(data.instances, (d) => d.score)
    };

    this.xScale = scaleBand({
      domain: this.initialDomain.x,
      range: [0, 800] //[0, width - margin.left - margin.right],
    });

    this.yScale = scaleLinear({
      domain: this.initialDomain.y,
      range: [30, 0], //[height - margin.top - margin.bottom, 0],
      clamp: true
    });

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  scaleReset() {
    const { xScale, yScale, initialDomain } = this;
    xScale.domain(initialDomain.x);
    yScale.domain(initialDomain.y);
  }

  handleMouseDown(event) {
    const { onBrushStart } = this.props;
    const { extent: region } = this;
    const { x, y } = getCoordsFromEvent(this.svg, event);
    onBrushStart(constrainToRegion({ region, x, y }));
  }

  handleMouseMove(event) {
    const { brush, onBrushDrag, updateBrush } = this.props;
    // only update the brush region if we're dragging
    if (!brush.isBrushing) return;
    const { extent: region } = this;

    console.log('in handleMouseMove: ', this);

    const { x, y } = getCoordsFromEvent(this.svg, event);
    onBrushDrag(constrainToRegion({ region, x, y }));
  }

  handleMouseUp(event) {
    const { brush, onBrushEnd, onBrushReset } = this.props;
    const { extent: region } = this;

    console.log('in handleMouseMove: ', this);

    if (brush.end) {
      const { x, y } = getCoordsFromEvent(this.svg, event);
      onBrushEnd(constrainToRegion({ region, x, y }));
      return;
    }
    onBrushReset(event);
    this.scaleReset();
  }

  render() {
    const { data, width, height, brush, margin } = this.props;
    const { xScale, yScale } = this;
    const { instances } = data;

    const x = d => d[0];
    const y = d => d[1];
    const z = d => d[2];

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const topInstances = instances.slice(0, 100);

    if (brush.domain) {
      const { domain } = brush;
      const { x0, x1, y0, y1 } = domain;

      console.log('in brush: ', brush, brush.domain, x0);
      console.log('scale invert: ', [x0, x1].map((d) => xScale.customInvert(d)));

      //xScale.domain([x0, x1].map(d => d - margin.left).map(xScale.invertExtent));
      // yScale.domain([y1, y0].map(d => d - margin.top).map(yScale.invert));
    }

    console.log('data', instances);
    console.log('xScale: ', xScale.domain(), xScale.range());
    console.log('yScale: ', yScale.domain(), yScale.range());

    xScale.customInvert = (function(){
        var domain = xScale.domain()
        var range = xScale.range()
        var scale = d3.scaleQuantize().domain(range).range(domain)
    
        return function(x){
            return scale(x)
        }
    })()

    return (
      <svg
        ref={c => {
          this.svg = c;
        }}
        width={width}
        height={height}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
      >
        <AxisBottom
          scale={xScale}
          top={yMax + margin.top}
          left={margin.left}
          label={''}
          stroke={'#1b1a1e'}
          tickTextFill={'#1b1a1e'}
        />
        <AxisLeft
          scale={yScale}
          top={margin.top}
          left={margin.left}
          label={''}
          stroke={'#1b1a1e'}
          tickTextFill={'#1b1a1e'}
        />
        <Group top={margin.top} left={margin.left}>
          {topInstances.map(instance => {
            return (
              <Bar
                width={2}
                height={30 - yScale(instance.score)}
                x={xScale(instance.ranking)}
                y={yScale(instance.score)}
                fill={'gray'}
                stroke={'black'}
                strokeWidth={1}
              />
            );
          })}
        </Group>
        <BoxBrush brush={brush} />
      </svg>
    );
  }
}

export default withBrush(WholeRankingChart);