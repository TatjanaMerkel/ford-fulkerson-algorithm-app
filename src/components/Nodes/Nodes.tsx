import React from "react";
import * as d3 from "d3";
import './Nodes.css';


class Nodes extends React.Component<any, any> {

    colors = d3.schemeCategory10;
    nodes = new Array<any>();
    lastNodeId: number = 0;


    componentDidMount() {

    }

    createNodes(event: any) {
        const point = d3.pointer(event)
        const node = {id: ++this.lastNodeId, x: point[0], y: point[1]};
        this.nodes.push(node);
        console.log(this.nodes);

        // add a circle element
        d3.select("svg").append("circle")
            .attr('class', 'node')
            .attr("cx", this.nodes[this.nodes.length - 1].x)
            .attr("cy", this.nodes[this.nodes.length - 1].y)
            .attr("r", 25)
            .style('fill', () => d3.rgb(this.colors[2]).brighter().toString())
            .style('stroke', () => d3.rgb(this.colors[2]).darker().toString())

    }

    render() {
        return (
            <div/>
        );
    }
}

export default Nodes;
