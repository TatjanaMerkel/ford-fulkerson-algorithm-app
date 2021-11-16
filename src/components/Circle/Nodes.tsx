import * as d3 from 'd3';
import {useEffect, useRef} from "react";
import './Nodes.css';

function Nodes() {
    const colors = d3.schemeCategory10;
    const ref: any = useRef()


    function mousedown(event: any) {
        if (event.type === "mousedown")
            console.log("Clicked!")
    }

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


    return (
        <div ref={ref}>

        </div>


    );
}

export default Nodes;
