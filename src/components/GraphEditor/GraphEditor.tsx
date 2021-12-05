import React, {RefObject} from 'react'
import * as d3 from 'd3'
import './GraphEditor.css'

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

        let svgGroups = svg.selectAll('g')
            .data(nodes)
            .enter().append('g')

        svgGroups.append('circle')
            .classed('node', true)
            .attr('r', 20)
            .style('fill', (node: Node) => d3.rgb(colors(String(node.color))).brighter().toString())
            .style('stroke', (node: Node) => d3.rgb(colors(String(node.color))).darker().toString())

        svgGroups.append('text')
            .text((node: Node) => node.name)

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

        function spawn(event: any, d: any) {
            svg.classed('active', event.currentTarget)

            // insert new node at point
            // const [x, y] = event
            const point = d3.pointer(event)
            const node = {name: 'X', color: 5, x: point[0], y: point[1]}

            nodes.push(node)
            console.log(nodes)
            simulation.nodes(nodes)

            const newSvgGroup = svg.selectAll('g')
                .data(nodes)
                .enter().append('g')

            newSvgGroup.append('circle')
                .classed('node', true)
                .attr('r', 20)
                .style('fill', (node: Node) => d3.rgb(colors(String(node.color))).brighter().toString())
                .style('stroke', (node: Node) => d3.rgb(colors(String(node.color))).darker().toString())

            newSvgGroup.append('text')
                .text((node: Node) => node.name)

            newSvgGroup
                .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)

            svgGroups = newSvgGroup.merge(svgGroups)

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
