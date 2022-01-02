import './GraphEditor.css'
import * as d3 from 'd3'
import {Selection, Simulation} from 'd3'
import React, {ChangeEvent, RefObject} from 'react'
import {fordFulkerson} from '../../ford-fulkerson/ford-fulkerson'
import Stepper from "../Stepper/Stepper";

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
    flow: number
}

interface Props {
}

interface State {
    selectedNode: Node | null
    selectedLink: Link | null
}

class GraphEditor extends React.Component<Props, State> {

    svg: RefObject<SVGSVGElement>

    nodes: Node[] = [
        {name: 'A', color: 0, x: 100, y: 100},
        {name: 'B', color: 1, x: 150, y: 200},
        {name: 'C', color: 2, x: 500, y: 300}
    ]

    nextNodeName = 'D'
    nextNodeColor = 3

    links: Link[] = [
        {source: this.nodes[0], target: this.nodes[2], capacity: 6, flow: 0},
        {source: this.nodes[2], target: this.nodes[1], capacity: 9, flow: 0}
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

        this.state = {
            selectedNode: null,
            selectedLink: null
        }

        this.svg = React.createRef()

        this.setNodeName = this.setNodeName.bind(this)
        this.setLinkCapacity = this.setLinkCapacity.bind(this)
        this.solve = this.solve.bind(this)
    }

    /// Event handlers

    private setNodeName(event: ChangeEvent<HTMLInputElement>): void {
        const newName = event.target.value

        const selectedNode = this.state.selectedNode

        if (selectedNode !== null) {
            selectedNode.name = newName
            this.setState({selectedNode})
        }

        this.updateSvgNodes(this.nodes)
    }

    private setLinkCapacity(event: ChangeEvent<HTMLInputElement>): void {
        const newLinkCapacity = Number(event.target.value)

        const selectedLink = this.state.selectedLink!

        selectedLink.capacity = newLinkCapacity
        this.setState({selectedLink})

        this.updateSvgLinks(this.links)
    }

    private solve(event: React.MouseEvent<HTMLButtonElement>): void {
        const fulkersonNodes = this.nodes.map((value, index) => index)
        const fulkersonLinks = this.links.map(link => ({
            source: this.nodes.indexOf(link.source),
            target: this.nodes.indexOf(link.target),
            capacity: link.capacity,
            flow: 0
        }))

        const logs = fordFulkerson(fulkersonNodes, fulkersonLinks)

        console.log(logs[logs.length - 1].maxFlow)

        const links = logs[logs.length - 1].links.map(link => ({
            source: this.nodes[link.source],
            target: this.nodes[link.target],
            capacity: link.capacity,
            flow: link.flow
        }))

        this.updateLinkFlows(links)
    }

    private updateLinkFlows(links: Link[]): void {
        for (const link of links) {
            const l = this.links.find(value => value.source === link.source && value.target === link.target)
            l!.flow = link.flow
        }

        this.updateSvgLinks(this.links)
    }

    /// componentDidMount()

    componentDidMount() {
        const svg = d3.select(this.svg.current)
            .on('contextmenu', (event: Event) => event.preventDefault())
            .on('mousedown', (event: Event) => this.spawnNode(event))
            .on('mousemove', (event: Event) => this.moveDragLine(event))
            .on('mouseup', () => this.cancelDragLine())

        this.simulation = d3.forceSimulation(this.nodes)
            .force('charge', d3.forceManyBody().strength(-1000))
            .force('x', d3.forceX(1000 / 2))
            .force('y', d3.forceY(500 / 2))
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
                return (node === this.state.selectedNode)
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
                return (node === this.state.selectedNode)
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
        this.simulation.force('link', d3.forceLink(links).distance(200))
        this.simulation.alpha(1).restart()
    }

    private updateSvgLinks(links: Link[]): void {
        this.svgLinkGroups = this.svgLinkGroupsGroup.selectAll('g').data(links)

        this.svgLinkGroups.selectAll('tspan')
            .text((link: any) => `${link.flow} / ${link.capacity}`)

        let newSvgLinkGroups = this.svgLinkGroupsGroup.selectAll('g')
            .data(links)
            .enter().append('g')

        newSvgLinkGroups.append('path')
            .attr('id', (link: Link) => `${link.source.name}${link.target.name}`)
            .classed('link', true)
            .style('marker-end', 'url(#end-arrow)')
            .on('mousedown', (event: Event, link: Link) => this.toggleSelectedLink(event, link))

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
        this.setState({selectedLink: null})

        // deselect potentially selected link
        const selectedNode = (this.state.selectedNode === node) ? null : node

        this.setState({selectedNode})
        this.updateSvgNodes(this.nodes)
    }

    private toggleSelectedLink(event: Event, link: Link): void {
        event.stopPropagation()

        // deselect potentially selected node
        this.setState({selectedNode: null})
        this.updateSvgNodes(this.nodes)

        const selectedLink = (this.state.selectedLink === link) ? null : link
        this.setState({selectedLink})
        this.updateSvgLinks(this.links)
    }

    private completeDragLine(node: Node) {
        if (this.dragStartNode === null || this.dragStartNode === node) {
            return
        }

        const sameLinks = this.links.filter((link: Link) =>
            link.source === this.dragStartNode && link.target === node)

        if (sameLinks.length === 0) {
            this.links.push({source: this.dragStartNode, target: node, capacity: 0, flow: 0})
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

            if (this.oppositeLinkExists(link)) {
                const arcRadius = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

                const move = `M ${link.source.x} ${link.source.y}`
                const arc = `A ${arcRadius} ${arcRadius} 0 0 1 ${targetX} ${targetY}`

                return `${move} ${arc}`

            } else {
                const move = `M ${link.source.x} ${link.source.y}`
                const line = `L ${targetX} ${targetY}`

                return `${move} ${line}`
            }
        })

        this.svgNodeGroups
            .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)
    }

    private oppositeLinkExists(link: Link): boolean {
        for (const l of this.links) {
            if (l.source === link.target && l.target === link.source) {
                return true
            }
        }

        return false
    }

    /// render()

    render() {
        return (
            <div id="graph-editor">
                <svg ref={this.svg}/>

                <div id="flow" className="ui-widget ui-background">
                    Flow: 0
                </div>

                <table className="ui-widget ui-background">
                    <tbody>
                    <tr>
                        <td>
                            <label htmlFor="nodeText">Node Name</label>
                        </td>
                        <td>
                            <div className="space"/>
                        </td>
                        <td>
                            <input id="nodeText"
                                   type="text"
                                   disabled={this.state.selectedNode === null}
                                   value={this.state.selectedNode ? this.state.selectedNode.name : ''}
                                   onChange={this.setNodeName}/>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="linkCapacity">Link Capacity</label>
                        </td>
                        <td>
                            <div className="space"/>
                        </td>
                        <td>
                            <input id="linkCapacity"
                                   type="number" min={0}
                                   disabled={this.state.selectedLink === null}
                                   value={this.state.selectedLink ? this.state.selectedLink.capacity : ''}
                                   onChange={this.setLinkCapacity}/>
                        </td>
                    </tr>
                    </tbody>
                </table>

                <Stepper maxSteps={7}/>



                <div id="menu" className="ui-widget">
                    <button className="btn" onClick={this.solve}>Solve</button>
                </div>
            </div>
        )
    }
}

export default GraphEditor
