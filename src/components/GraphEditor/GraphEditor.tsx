import './GraphEditor.css'
import * as d3 from 'd3'
import {Selection, Simulation} from 'd3'
import React, {RefObject} from 'react'

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

    width = 960
    height = 500

    divRef: RefObject<HTMLDivElement>

    nodes: Node[] = [
        {name: 'A', color: 0, x: 100, y: 100},
        {name: 'B', color: 1, x: 150, y: 200},
        {name: 'C', color: 2, x: 500, y: 300}
    ]

    nextNodeName = 'D'
    nextNodeColor = 3

    links: Link[] = [
        {source: this.nodes[0], target: this.nodes[1]},
        {source: this.nodes[1], target: this.nodes[2]}
    ]

    simulation!: Simulation<any, any>

    svgLinks!: Selection<any, Link, any, unknown>
    svgGroups!: Selection<any, Node, any, unknown>
    dragStartNode: null | Node = null

    svgGroupsGroup!: Selection<SVGGElement, unknown, null, undefined>
    svgLinksGroup!: Selection<SVGGElement, unknown, null, undefined>
    svgDragLine!: Selection<SVGLineElement, unknown, null, undefined>

    colors = d3.scaleOrdinal(d3.schemeCategory10)

    constructor(props: any) {
        super(props)

        this.divRef = React.createRef()
    }

    componentDidMount() {
        const svg = d3.select(this.divRef.current)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .on('contextmenu', (event: Event) => event.preventDefault())
            .on('mousedown', (event: Event) => this.spawnNode(event))
            .on('mousemove', (event: Event) => this.moveDragLine(event))
            .on('mouseup', () => this.cancelDragLine())

        this.simulation = d3.forceSimulation(this.nodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(this.width / 2))
            .force('y', d3.forceY(this.height / 2))
            .on('tick', () => this.tick())

        // Define arrow markers for links
        svg.append('defs')
            .append('marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000')

        this.svgDragLine = svg.append('line')
            .style('marker-end', 'url(#end-arrow)')
            .attr('class', 'dragline hidden')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)

        this.svgLinksGroup = svg.append('g')
        this.updateLinks(this.links)

        this.svgGroupsGroup = svg.append('g')
        this.updateSvgNodes(this.nodes)

        this.simulation.restart()
    }

    /// Update nodes and links

    private updateSvgNodes(nodes: Node[]): void {
        this.svgGroups = this.svgGroupsGroup.selectAll('g').data(nodes)

        let newSvgGroups = this.svgGroupsGroup.selectAll('g')
            .data(nodes)
            .enter().append('g')

        newSvgGroups.append('circle')
            .classed('node', true)
            .attr('r', 20)
            .style('fill', (node: Node) => d3.rgb(this.colors(String(node.color))).brighter().toString())
            .style('stroke', (node: Node) => d3.rgb(this.colors(String(node.color))).darker().toString())
            .on('mousedown', (event: Event, node: Node) => this.startDragLine(node))
            .on('mouseup', (event: Event, node: Node) => this.completeDragLine(node))

        newSvgGroups.append('text')
            .text((node: Node) => node.name)

        this.svgGroups = newSvgGroups.merge(this.svgGroups)
    }

    private updateLinks(links: Link[]) {
        this.updateSvgLinks(links)
        this.simulation.force('link', d3.forceLink(links).distance(150))
        this.simulation.alpha(1).restart()
    }

    private updateSvgLinks(links: Link[]): void {
        this.svgLinks = this.svgLinksGroup.selectAll('.link').data(links)

        const newSvgLink = this.svgLinks
            .enter().append('line')
            .classed('link', true)
            .style('marker-end', 'url(#end-arrow)')

        this.svgLinks = newSvgLink.merge(this.svgLinks)
    }

    /// DragLine methods

    private startDragLine(node: Node) {
        this.dragStartNode = node

        this.svgDragLine
            .classed('hidden', false)
            .attr('x1', node.x)
            .attr('y1', node.y)
            .attr('x2', node.x)
            .attr('y2', node.y)
    }

    private moveDragLine(event: Event) {
        if (this.dragStartNode === null) {
            return
        }

        const [x, y] = d3.pointer(event)

        this.svgDragLine
            .attr('x1', this.dragStartNode.x)
            .attr('y1', this.dragStartNode.y)
            .attr('x2', x)
            .attr('y2', y)
    }

    private cancelDragLine() {
        this.svgDragLine.classed('hidden', true)
        this.dragStartNode = null
    }

    private completeDragLine(node: Node) {
        if (this.dragStartNode === null || this.dragStartNode === node) {
            return
        }

        const sameLinks = this.links.filter((link: Link) =>
            link.source === this.dragStartNode && link.target === node)

        if (sameLinks.length === 0) {
            this.links.push({source: this.dragStartNode, target: node})
            this.updateLinks(this.links)
        }
    }

    /// spawnNode()

    private spawnNode(event: Event): void {
        if (this.nodes.length >= 26) {
            return
        }

        if (this.dragStartNode !== null) {
            return
        }

        const [x, y] = d3.pointer(event);
        const node = {name: this.nextNodeName, color: this.nextNodeColor, x, y}
        this.nodes.push(node)

        this.nextNodeName = String.fromCharCode(this.nextNodeName.charCodeAt(0) + 1)
        this.nextNodeColor = (this.nextNodeColor + 1) % 10

        this.simulation.nodes(this.nodes)
        this.updateSvgNodes(this.nodes)

        this.simulation.alpha(1).restart()
    }

    /// Simulation.tick()

    private tick(): void {
        this.svgLinks.each(function (link: Link) {

            const deltaX = link.target.x - link.source.x
            const deltaY = link.target.y - link.source.y
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            const targetX = link.target.x - deltaX * 25 / dist
            const targetY = link.target.y - deltaY * 25 / dist

            d3.select(this)
                .attr('x1', link.source.x)
                .attr('y1', link.source.y)
                .attr('x2', targetX)
                .attr('y2', targetY)
        })

        this.svgGroups
            .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)
    }

    /// render()

    render() {
        return (
            <div ref={this.divRef}/>
        )
    }
}

export default GraphEditor
