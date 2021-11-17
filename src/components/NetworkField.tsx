import * as d3 from 'd3';
import {useEffect, useRef} from "react";
import Nodes from "./Nodes/Nodes";

function NetworkField() {
    const ref: any = useRef()
    const childRef: any = useRef();

    useEffect(() => {
        const svg = d3.select(ref.current)
        svg.append("svg")
            .attr("width", 960)
            .attr("height", 500)
            .style("border", "2px solid black")
            // method cancels the event if it is cancelable,
            .on('contextmenu', (event) => {
                event.preventDefault();
            })


    })
    return (
        <div ref={ref} onMouseDown={(event) => childRef.current.createNodes(event)}>
            <Nodes ref={childRef}/>
        </div>
    );


}

export default NetworkField;
