import './GraphEditor.css'
import * as d3 from 'd3'
import {Selection, Simulation} from 'd3'
import React, {ChangeEvent, RefObject} from 'react'

interface Node {
    name: string
    color: number
    x: number
    y: number
}

interface Link {
    source: Node
    target: Node
    capacity: number
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

    selectedNode: null | Node = null

    nextNodeName = 'D'
    nextNodeColor = 3

    links: Link[] = [
        {source: this.nodes[0], target: this.nodes[1], capacity: 6},
        {source: this.nodes[1], target: this.nodes[2], capacity: 9}
    ]

    simulation!: Simulation<any, any>

    svgNodeGroupsGroup!: Selection<SVGGElement, unknown, null, undefined>
    svgLinkGroupsGroup!: Selection<SVGGElement, unknown, null, undefined>

    svgNodeGroups!: Selection<any, Node, any, unknown>
    svgLinkGroups!: Selection<any, Link, any, unknown>

    dragStartNode: null | Node = null
    svgDragLine!: Selection<SVGLineElement, unknown, null, undefined>

    colors = d3.scaleOrdinal(d3.schemeCategory10)

    constructor(props: any) {
        super(props)

        this.divRef = React.createRef()

        this.setNodeName = this.setNodeName.bind(this)
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

        this.svgLinkGroupsGroup = svg.append('g')
        this.updateLinks(this.links)

        this.svgNodeGroupsGroup = svg.append('g')
        this.updateSvgNodes(this.nodes)

        this.simulation.restart()
    }

    /// Update nodes and links

    private updateSvgNodes(nodes: Node[]): void {
        this.svgNodeGroups = this.svgNodeGroupsGroup.selectAll('g').data(nodes)

        this.svgNodeGroups.selectAll('circle')
            .style('fill', (node: any) => {
                return (node === this.selectedNode)
                    ? d3.rgb(this.colors(String(node.color))).brighter().toString()
                    : this.colors(String(node.color));
            })

        this.svgNodeGroups.selectAll('text')
            .text((node: any) => node.name)

        let newSvgNodeGroups = this.svgNodeGroupsGroup.selectAll('g')
            .data(nodes)
            .enter().append('g')
            .classed('node-group', true)

        newSvgNodeGroups.append('circle')
            .classed('node', true)
            .attr('r', 20)
            .style('fill', (node: Node) => {
                return (node === this.selectedNode)
                    ? d3.rgb(this.colors(String(node.color))).brighter().toString()
                    : this.colors(String(node.color));
            })
            .style('stroke', (node: Node) => d3.rgb(this.colors(String(node.color))).darker().toString())
            .on('mousedown', (event: Event, node: Node) => this.startDragLine(node))
            .on('mouseup', (event: Event, node: Node) => this.onCircleMouseUp(node))

        newSvgNodeGroups.append('text')
            .text((node: Node) => node.name)

        this.svgNodeGroups = newSvgNodeGroups.merge(this.svgNodeGroups)
    }

    private updateLinks(links: Link[]) {
        this.updateSvgLinks(links)
        this.simulation.force('link', d3.forceLink(links).distance(150))
        this.simulation.alpha(1).restart()
    }

    private updateSvgLinks(links: Link[]): void {
        this.svgLinkGroups = this.svgLinkGroupsGroup.selectAll('g').data(links)

        let newSvgLinkGroups = this.svgLinkGroupsGroup.selectAll('g')
            .data(links)
            .enter().append('g')

        newSvgLinkGroups.append('path')
            .attr('id', (link: Link) => `${link.source.name}${link.target.name}`)
            .classed('link', true)
            .style('marker-end', 'url(#end-arrow)')

        newSvgLinkGroups.append('text')
            .append('textPath')
            .attr('xlink:href', (link: Link) => `#${link.source.name}${link.target.name}`)
            .attr('startOffset', '50%')
            .append('tspan')
            .attr('dy', -10)
            .text((link: Link) => `0 / ${link.capacity}`)

        this.svgLinkGroups = newSvgLinkGroups.merge(this.svgLinkGroups)
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

    private onCircleMouseUp(node: Node): void {
        if (node === this.dragStartNode) {
            this.toggleSelectedNode(node)
        } else {
            this.completeDragLine(node)
        }
    }

    private toggleSelectedNode(node: Node): void {
        this.selectedNode = (this.selectedNode === node) ? null : node
        this.updateSvgNodes(this.nodes)
    }

    private completeDragLine(node: Node) {
        if (this.dragStartNode === null || this.dragStartNode === node) {
            return
        }

        const sameLinks = this.links.filter((link: Link) =>
            link.source === this.dragStartNode && link.target === node)

        if (sameLinks.length === 0) {
            this.links.push({source: this.dragStartNode, target: node, capacity: 0})
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
        const links: Selection<any, any, any, any> = this.svgLinkGroups.selectAll('.link')
        links.attr('d', (link: Link) => {
            const deltaX = link.target.x - link.source.x
            const deltaY = link.target.y - link.source.y
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            const targetX = link.target.x - deltaX * 25 / dist
            const targetY = link.target.y - deltaY * 25 / dist

            return `M${link.source.x},${link.source.y}L${targetX},${targetY}`
        })

        this.svgNodeGroups
            .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)
    }

    /// <input> onChange()

    private setNodeName(event: ChangeEvent<HTMLInputElement>): void {
        const newName = event.target.value

        if (this.selectedNode !== null) {
            this.selectedNode.name = newName
        }

        this.updateSvgNodes(this.nodes)
    }

    /// render()

    render() {
        return (
            <div ref={this.divRef}>
                <input onChange={this.setNodeName}/>
            </div>
        )
    }
}

export default GraphEditor
