import * as d3 from 'd3';
import {useEffect, useRef} from "react";

function Circle() {

    const ref: any = useRef()

    useEffect(() => {
        const svg = d3.select(ref.current).append("svg").attr("width", 200).attr("height", 200)

        svg.append('circle')
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', 50)
            .attr('stroke', 'black')
            .attr('fill', '#69a3b2');


    })


    return (
        <div ref={ref}>

        </div>


    );
}

export default Circle;
