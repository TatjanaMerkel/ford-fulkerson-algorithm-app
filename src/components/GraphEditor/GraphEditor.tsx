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

    nodes: Node[] = [
        {name: 'A', color: 0, x: 100, y: 100},
        {name: 'B', color: 1, x: 150, y: 200},
        {name: 'C', color: 2, x: 500, y: 300}
    ]

    links: Link[] = [
        {source: this.nodes[0], target: this.nodes[1]},
        {source: this.nodes[1], target: this.nodes[2]}
    ]

    svgLinks!: Selection<any, Link, any, unknown>
    svgGroups!: Selection<any, Node, any, unknown>

    constructor(props: any) {
        super(props)

        this.divRef = React.createRef()
    }

    componentDidMount() {
        const width = 960
        const height = 500

        const colors = d3.scaleOrdinal(d3.schemeCategory10)

        const spawn = (event: Event) => {
            if (dragStartNode !== null) {
                return
            }

            const [x, y] = d3.pointer(event);
            const node = {name: 'X', color: 5, x, y}
            this.nodes.push(node)

            simulation.nodes(this.nodes)
            updateSvgNodes(this.nodes)

            simulation.alpha(1).restart()
        }

        const svg = d3.select(this.divRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('contextmenu', (event: Event) => {
                event.preventDefault()
            })
            .on('mousedown', spawn)
            .on('mousemove', (event: Event) => {
                if (dragStartNode === null) {
                    return
                }

                const [x, y] = d3.pointer(event)

                dragLine
                    .attr('x1', dragStartNode.x)
                    .attr('y1', dragStartNode.y)
                    .attr('x2', x)
                    .attr('y2', y)
            })
            .on('mouseup', () => {
                dragLine.classed('hidden', true)
                dragStartNode = null
            })

        const svgLinksGroup = svg.append('g')

        const updateSvgLinks = (links: Link[]): void => {
            this.svgLinks = svgLinksGroup.selectAll('.link').data(links)

            const newSvgLink = this.svgLinks
                .enter().append('line')
                .classed('link', true)

            this.svgLinks = newSvgLink.merge(this.svgLinks)
        }

        const dragLine = svg.append('line')
            .attr('class', 'dragline hidden')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)

        let dragStartNode: null | Node = null

        const simulation = d3.forceSimulation(this.nodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2))
            .on('tick', () => this.tick())

        function updateLinks(links: Link[]) {
            updateSvgLinks(links)
            simulation.force('link', d3.forceLink(links).distance(150))
            simulation.alpha(1).restart()
        }

        updateLinks(this.links)

        const svgGroupsGroup = svg.append('g')

        const updateSvgNodes = (nodes: Node[]): void => {
            this.svgGroups = svgGroupsGroup.selectAll('g').data(nodes)

            let newSvgGroups = svgGroupsGroup.selectAll('g')
                .data(nodes)
                .enter().append('g')

            newSvgGroups.append('circle')
                .classed('node', true)
                .attr('r', 20)
                .style('fill', (node: Node) => d3.rgb(colors(String(node.color))).brighter().toString())
                .style('stroke', (node: Node) => d3.rgb(colors(String(node.color))).darker().toString())
                .on('mousedown', (event: Event, node: Node) => {
                    dragStartNode = node

                    dragLine
                        .classed('hidden', false)
                        .attr('x1', node.x)
                        .attr('y1', node.y)
                        .attr('x2', node.x)
                        .attr('y2', node.y)
                })
                .on('mouseup', (event: Event, node: Node) => {
                    if (dragStartNode === null || dragStartNode === node) {
                        return
                    }

                    const sameLinks = this.links.filter((link: Link) =>
                        link.source === dragStartNode && link.target === node)

                    if (sameLinks.length === 0) {
                        this.links.push({source: dragStartNode, target: node})
                        updateLinks(this.links)
                    }
                })

            newSvgGroups.append('text')
                .text((node: Node) => node.name)

            this.svgGroups = newSvgGroups.merge(this.svgGroups)
        }

        updateSvgNodes(this.nodes)

        simulation.restart()
    }

    tick(): void {
        this.svgLinks
            .attr('x1', (link: Link) => link.source.x)
            .attr('y1', (link: Link) => link.source.y)
            .attr('x2', (link: Link) => link.target.x)
            .attr('y2', (link: Link) => link.target.y)

        this.svgGroups
            .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)
    }

    render() {
        return (
            <div ref={this.divRef}/>
        )
    }
}

export default GraphEditor
