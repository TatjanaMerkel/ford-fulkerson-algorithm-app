import React from "react";
import * as d3 from "d3";
import './Nodes.css';


class Nodes extends React.Component<any, any> {


    svgRef: React.RefObject<any>;
    width = 960;
    height = 500;
    svg: any;

    colors = d3.scaleOrdinal(d3.schemeCategory10);
    nodes = new Array<any>();
    lastNodeId: number = 0;
    force: any;
    path: any;
    circle: any;


    constructor(props: any) {
        super(props);
        this.svgRef = React.createRef();
    }

    componentDidMount() {
        this.svg = d3.select(this.svgRef.current)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .on('contextmenu', (event, d) => { event.preventDefault(); })

        this.nodes = [
            { id: 0 },
            { id: 1 },
            { id: 2}
        ];

        this.lastNodeId = 2;


        // init D3 force layout
        this.force = d3.forceSimulation()
            .force('link', d3.forceLink().id((d: any) => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(this.width / 2))
            .force('y', d3.forceY(this.height / 2))
            .on('tick', () => this.tick());


        // handles to link and node element groups
        this.path = this.svg.append('svg:g').selectAll('path');
        this.circle = this.svg.append('svg:g').selectAll('g');

        // app starts here
        this.svg.on('mousedown', (event: any, d: any) => this.mousedown(event, d))

        this.restart();
    }



    tick() {
        this.path.attr('d', (d: any) => {
            const deltaX = d.target.x - d.source.x;
            const deltaY = d.target.y - d.source.y;
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const normX = deltaX / dist;
            const normY = deltaY / dist;
            const sourcePadding = d.left ? 17 : 12;
            const targetPadding = d.right ? 17 : 12;
            const sourceX = d.source.x + (sourcePadding * normX);
            const sourceY = d.source.y + (sourcePadding * normY);
            const targetX = d.target.x - (targetPadding * normX);
            const targetY = d.target.y - (targetPadding * normY);

            return `M${sourceX},${sourceY}L${targetX},${targetY}`;
        });

        this.circle.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    }

    restart() {

        this.circle = this.circle.data(this.nodes, (d: any) => d.id);

        // add new nodes
        const g = this.circle.enter().append('svg:g');

        g.append('svg:circle')
            .attr('class', 'node')
            .attr('r', 20)
            .style('fill', (d: any) =>  d3.rgb(this.colors(d.id)).brighter().toString())
            .style('stroke', (d: any) => d3.rgb(this.colors(d.id)).darker().toString())
            .on('mousedown', (event: any, d: any) => {
                if (event.ctrlKey) return;

                this.restart();
            });

        // show node IDs
        g.append('svg:text')
            .attr('x', 0)
            .attr('y', 4)
            .attr('class', 'id')
            .text((d: any) => d.id);

        this.circle = g.merge(this.circle);

        // set the graph in motion
        this.force
            .nodes(this.nodes)

        this.force.alphaTarget(0.3).restart();
    }

    mousedown(event: any, d: any) {

        // insert new node at point
        const point = d3.pointer(event);
        const node = { id: ++this.lastNodeId, x: point[0], y: point[1] };
        this.nodes.push(node);

        this.restart();
    }


    render() {
        return (
            <div ref={this.svgRef}> </div>
        )
    }

}

export default Nodes;
