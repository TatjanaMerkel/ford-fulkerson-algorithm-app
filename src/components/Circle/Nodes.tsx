import * as d3 from 'd3';
import {useEffect, useRef} from "react";
import './Nodes.css';

function Nodes(props: any) {
    const colors = d3.schemeCategory10;
    const ref: any = useRef()

    let circle: any;

    const nodes = new Array<any>();

    useEffect(() => {
        const svg = d3.select(ref.current)
            .append("svg")
            .attr("width", 960)
            .attr("height", 500)
            .style("border", "2px solid black")
            // method cancels the event if it is cancelable,
            .on('contextmenu', (event) => {
                event.preventDefault();
            })


        svg.append('circle')
            .attr('class', 'node')
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', 20)
            .style('fill', () => d3.rgb(colors[2]).brighter().toString())
            .style('stroke', () => d3.rgb(colors[2]).darker().toString())


        svg.on('mousedown', event => mousedown(event))
    })


    const mousedown = (event: any) => {
        // insert new node with at point
        const point = d3.pointer(event);
        const node = {x: point[0], y: point[1]};
        nodes.push(node);
        console.log(nodes);

        update();
    }

    const update = () => {
        d3.select("svg").append("circle")
            .attr("cx", nodes[nodes.length-1].x)
            .attr("cy", nodes[nodes.length-1].y)
            .attr("r", 25)
            .style("fill", "purple");
    }

    return (
        <div ref={ref}/>
    );
}

export default Nodes;
