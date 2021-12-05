import './GraphEditor.css'
import * as d3 from 'd3'
import React, {RefObject} from 'react'
import {Selection} from 'd3'

interface Node {
    name: string
    color: number
    x: number
    y: number
}

interface Link {
    source: Node
    target: Node
}

class GraphEditor extends React.Component {

    divRef: RefObject<HTMLDivElement>

    constructor(props: any) {
        super(props)

        this.divRef = React.createRef()
    }

    componentDidMount() {
        const width = 960
        const height = 500

        const nodes = [
            {name: 'A', color: 0, x: 100, y: 100},
            {name: 'B', color: 1, x: 150, y: 200},
            {name: 'C', color: 2, x: 500, y: 300}
        ]

        const links = [
            {source: nodes[0], target: nodes[1]},
            {source: nodes[1], target: nodes[2]}
        ]

        const colors = d3.scaleOrdinal(d3.schemeCategory10)

        const svg = d3.select(this.divRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('contextmenu', (event: Event) => {
                event.preventDefault()
            })
            .on('mousedown', spawn)

        const svgLinks = svg.selectAll('.link')
            .data(links)
            .join('line')
            .classed('link', true)

        let svgGroups: Selection<any, Node, SVGSVGElement, unknown>

        function updateSvgNodes(nodes: Node[]): void {
            svgGroups = svg.selectAll('g').data(nodes)

            let newSvgGroups = svg.selectAll('g')
                .data(nodes)
                .enter().append('g')

            newSvgGroups.append('circle')
                .classed('node', true)
                .attr('r', 20)
                .style('fill', (node: Node) => d3.rgb(colors(String(node.color))).brighter().toString())
                .style('stroke', (node: Node) => d3.rgb(colors(String(node.color))).darker().toString())

            newSvgGroups.append('text')
                .text((node: Node) => node.name)

            svgGroups = newSvgGroups.merge(svgGroups)
        }

        updateSvgNodes(nodes)

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2))
            .on('tick', () => tick())

        simulation.restart()

        function tick() {
            svgLinks
                .attr('x1', (link: Link) => link.source.x)
                .attr('y1', (link: Link) => link.source.y)
                .attr('x2', (link: Link) => link.target.x)
                .attr('y2', (link: Link) => link.target.y)

            svgGroups
                .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)
        }

        function spawn(event: Event) {
            const [x, y] = d3.pointer(event)
            const node = {name: 'X', color: 5, x, y}
            nodes.push(node)

            simulation.nodes(nodes)
            updateSvgNodes(nodes)

            simulation.alpha(1).restart()
        }
    }

    render() {
        return (
            <div ref={this.divRef}/>
        )
    }
}

export default GraphEditor
