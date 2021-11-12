import React from 'react';
import './App.css';

import * as d3 from "d3";

class App extends React.Component {
    svgRef: React.RefObject<any>;
    width = 1000;
    height = 500;
    svg: any;

    componentDidMount() {
        // Runs after the first render() lifecycle

        // ref updates happen before componentDidMount
        // get the current value form the ref object (definitely available within componentDidMount)
        // using ! to remove undefined/null from type definition
        this.svg = d3.select(this.svgRef.current!)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
    }

    constructor(props: any) {
        super(props);
        this.svgRef = React.createRef();
    }

    render() {
        return (
            <div ref={this.svgRef} />
        )
    }
}

export default App;

