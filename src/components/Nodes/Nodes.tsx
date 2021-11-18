import React from "react";
import * as d3 from "d3";
import './Nodes.css';


class Nodes extends React.Component<any, any> {

    colors = d3.schemeCategory10;
    nodes = new Array<any>();
    lastNodeId: number = 0;
    circle: any;

    componentDidMount() {

    }

    createNodes(event: any) {

        // insert new node at point
        const point = d3.pointer(event)
        const node = {id: ++this.lastNodeId, x: point[0], y: point[1]};
        this.nodes.push(node);
        console.log(this.nodes);

        this.circle = d3.select('svg').append('svg:g').selectAll('g');
        this.circle.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        this.circle = this.circle.data(this.nodes, (d: any) => d.id)
        this.circle.selectAll('circle')
            .style('fill', () => d3.rgb(this.colors[2]).brighter().toString())

        const g = this.circle.enter().append('svg:g')
        g.append('svg:circle')
            .attr('class', 'node')
            .attr('cx', this.nodes[this.nodes.length - 1].x)
            .attr('cy', this.nodes[this.nodes.length - 1].y)
            .attr('r', 25)
            .style('fill', () => d3.rgb(this.colors[2]).brighter().toString())
            .style('stroke', () => d3.rgb(this.colors[2]).darker().toString())

        g.append('svg:text')
            .attr('x', 0)
            .attr('y', 4)
            .attr('class', 'id')
            .text((d: any) => d.id)
            .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        

    }

    render() {
        return (
            <div/>
        );
    }
}

export default Nodes;
