import React, {RefObject} from 'react'
import * as d3 from 'd3'
import {Selection} from 'd3'
import './GraphEditor.css'

interface Node {
    x: number
    y: number
}

interface Link {
    source: Node
    target: Node
}

class GraphEditor extends React.Component {

    divRef: RefObject<HTMLDivElement>

    // svg: undefined | Selection<SVGSVGElement, unknown, null, undefined>

    constructor(props: any) {
        super(props)

        this.divRef = React.createRef()
    }

    componentDidMount() {
        const width = 960
        const height = 500

        const svg = d3.select(this.divRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('contextmenu', (event: Event) => {
                event.preventDefault()
            })

        const nodes = [
            {x: 100, y: 100},
            {x: 150, y: 200},
            {x: 500, y: 300}
        ]

        const links = [
            {source: nodes[0], target: nodes[1]},
            {source: nodes[1], target: nodes[2]}
        ]

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2))
            .on('tick', () => tick())

        simulation.restart()

        function tick() {
            console.log('tick')
            console.log(nodes)
            console.log(links)

            svg.selectAll('.link')
                .data(links)
                .join('line')
                .classed('link', true)
                .attr('x1', (link: Link) => link.source.x)
                .attr('y1', (link: Link) => link.source.y)
                .attr('x2', (link: Link) => link.target.x)
                .attr('y2', (link: Link) => link.target.y)

            svg.selectAll('.node')
                .data(nodes)
                .join('circle')
                .classed('node', true)
                .attr('r', 12)
                .attr('cx', (node: Node) => node.x)
                .attr('cy', (node: Node) => node.y)
        }
    }

    render() {
        return (
            <div ref={this.divRef}/>
        )
    }
}

export default GraphEditor
