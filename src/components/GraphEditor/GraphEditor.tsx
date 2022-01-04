import './GraphEditor.scss'
import * as d3 from 'd3'
import {Selection, Simulation} from 'd3'
import React, {ChangeEvent, ReactElement, RefObject} from 'react'
import Stepper from '../Stepper/Stepper'
import {fordFulkerson, LogEntry} from '../../ford-fulkerson/ford-fulkerson'

interface Node {
    name: string
    x: number
    y: number
    color: string
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
    mode: Mode

    currentStep: null | number
}

enum Mode {
    EDIT,
    SOLUTION
}

class GraphEditor extends React.Component<Props, State> {

    svg: RefObject<SVGSVGElement>
    nodeNameInput: RefObject<HTMLInputElement>
    linkCapacityInput: RefObject<HTMLInputElement>

    sourceNode: Node = {name: 'A', x: 100, y: 200, color: 'white'}
    sinkNode: Node = {name: 'Z', x: 500, y: 200, color: 'white'}

    nextNodeName = 'D'
    nextNodeColor = 0

    colors = d3.scaleOrdinal(d3.schemeCategory10)

    nodes: Node[] = [
        this.sourceNode,
        this.sinkNode,
        {name: 'B', x: 300, y: 200, color: this.colors(String(this.nextNodeColor++))},
        {name: 'C', x: 300, y: 200, color: this.colors(String(this.nextNodeColor++))}
    ]

    links: Link[] = [
        {source: this.nodes[0], target: this.nodes[2], capacity: 3, flow: 0},
        {source: this.nodes[2], target: this.nodes[1], capacity: 2, flow: 0},
        {source: this.nodes[0], target: this.nodes[3], capacity: 2, flow: 0},
        {source: this.nodes[3], target: this.nodes[1], capacity: 4, flow: 0},
        {source: this.nodes[2], target: this.nodes[3], capacity: 2, flow: 0},
        {source: this.nodes[3], target: this.nodes[2], capacity: 3, flow: 0}
    ]

    simulation!: Simulation<any, any>

    svgNodeRoot!: Selection<SVGGElement, null, null, undefined>
    svgLinkRoot!: Selection<SVGGElement, null, null, undefined>

    dragStartNode: null | Node = null
    svgDragLine!: Selection<SVGLineElement, null, null, undefined>

    logs: null | LogEntry[] = null

    constructor(props: any) {
        super(props)

        this.state = {
            selectedNode: null,
            selectedLink: null,
            mode: Mode.EDIT,

            currentStep: null
        }

        this.svg = React.createRef()
        this.nodeNameInput = React.createRef()
        this.linkCapacityInput = React.createRef()

        this.deleteSelectedLink = this.deleteSelectedLink.bind(this)
        this.deleteSelectedNode = this.deleteSelectedNode.bind(this)
        this.edit = this.edit.bind(this)
        this.setLinkCapacity = this.setLinkCapacity.bind(this)
        this.setNodeName = this.setNodeName.bind(this)
        this.solve = this.solve.bind(this)
        this.tick = this.tick.bind(this)
    }

    /// componentDidMount()

    componentDidMount() {
        const svgRef = this.svg.current!
        const svgSelection: Selection<SVGSVGElement, null, null, undefined> = d3.select(svgRef)

        this.setSvgHandlers(svgSelection)
        this.createSvgDefs(svgSelection)
        this.createSvgDragLine(svgSelection)

        this.svgLinkRoot = svgSelection.append('g')
        this.svgNodeRoot = svgSelection.append('g')

        this.updateSvgLinks()
        this.updateSvgNodes()

        this.simulation = d3.forceSimulation(this.nodes)
            .force('charge', d3.forceManyBody().strength(-1000))
            .force('x', d3.forceX(svgRef.clientWidth / 2))
            .force('y', d3.forceY(svgRef.clientHeight / 2))
            .on('tick', this.tick)

        this.simulation.restart()
    }

    setSvgHandlers(svgSelection: Selection<SVGSVGElement, null, null, undefined>): void {
        svgSelection
            .on('contextmenu', (event: Event) => event.preventDefault())
            .on('mousedown', (event: Event) => this.spawnNode(event))
            .on('mousemove', (event: Event) => this.moveDragLine(event))
            .on('mouseup', () => this.cancelDragLine())
    }

    createSvgDefs(svgSelection: Selection<SVGSVGElement, null, null, undefined>): void {
        const defs = svgSelection.append('defs')

        const marker = defs.append('marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')

        marker.append('path')
            .attr('d', 'M 0 -5 L 10 0 L 0 5')
            .attr('fill', '#000')
    }

    createSvgDragLine(svgSelection: Selection<SVGSVGElement, null, null, undefined>): void {
        this.svgDragLine = svgSelection.append('line')
            .classed('dragLine', true)
            .classed('hidden', true)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)
            .style('marker-end', 'url(#end-arrow)')
    }

    /// Simulation

    updateSimNodes(): void {
        this.simulation.nodes(this.nodes)
    }

    updateSimLinks(): void {
        this.simulation.force('link', d3.forceLink(this.links).distance(200))
    }

    restartSim(): void {
        this.simulation.alpha(1).restart()
    }

    /// getNextNodeName()

    getNextNodeName(): string {
        const nextNodeName = this.nextNodeName
        let newNextNodeName = nextNodeName

        do {
            newNextNodeName = this.getNextChar(newNextNodeName)
        } while (!this.nodeNameExists(newNextNodeName))

        return nextNodeName
    }

    getNextChar(char: string): string {
        return String.fromCharCode(char.charCodeAt(0) + 1)
    }

    nodeNameExists(name: string): boolean {
        return this.nodes.find(node => node.name === name) !== undefined
    }

    /// Event handlers

    setNodeName(event: ChangeEvent<HTMLInputElement>): void {
        const newName = event.target.value

        const selectedNode = this.state.selectedNode

        if (selectedNode !== null) {
            selectedNode.name = newName
            this.setState({selectedNode})
        }

        this.updateSvgNodes()
    }

    setLinkCapacity(event: ChangeEvent<HTMLInputElement>): void {
        const newLinkCapacity = Number(event.target.value)

        const selectedLink = this.state.selectedLink!

        selectedLink.capacity = newLinkCapacity
        this.setState({selectedLink})

        this.updateSvgLinks()
    }

    solve(): void {
        const fulkersonNodes = this.nodes.map((value, index) => index)
        const fulkersonLinks = this.links.map(link => ({
            source: this.nodes.indexOf(link.source),
            target: this.nodes.indexOf(link.target),
            capacity: link.capacity,
            flow: 0
        }))

        this.logs = fordFulkerson(fulkersonNodes, fulkersonLinks)

        this.drawGraphAtStep(0)
        this.setState({currentStep: 0})
        this.setState({mode: Mode.SOLUTION}, this.updateSvgLinks)
    }

    edit(): void {
        this.setState({currentStep: null})
        this.logs = null
        this.setState({mode: Mode.EDIT}, this.updateSvgLinks)
    }

    drawGraphAtStep(step: number): void {
        const currentLog: LogEntry = this.logs![step]

        this.links = currentLog.links.map(this.getLink)
        this.updateSvgLinks()
    }

    /// Update nodes and links

    updateSvgNodes(): void {
        /// Handle new nodes

        const newSvgNodes = this.svgNodeRoot.selectAll('g').data(this.nodes)
            .enter().append('g')
            .classed('node', true)

        newSvgNodes.append('circle')
            .attr('r', 20)

        newSvgNodes.append('text')

        /// Handle new & updated nodes

        const svgNodes = this.svgNodeRoot.selectAll('g').data(this.nodes)

        svgNodes.select('circle')
            .style('fill', (node: Node) => (node === this.state.selectedNode)
                ? d3.rgb(node.color).brighter().toString()
                : node.color)
            .style('stroke', (node: Node) => d3.rgb(node.color).darker().toString())
            .on('mousedown', (event: Event, node: Node) => this.startDragLine(node))
            .on('mouseup', (event: Event, node: Node) => this.onCircleMouseUp(node))

        svgNodes.select('text')
            .text((node: Node) => node.name)
            .style('fill', (node: Node) => (node === this.sourceNode || node === this.sinkNode)
                ? 'black'
                : 'white')

        /// Handle deleted nodes

        this.svgNodeRoot.selectAll('g').data(this.nodes)
            .exit().remove()
    }

    updateSvgLinks(): void {
        /// Create new links

        const newSvgLinks = this.svgLinkRoot.selectAll('g').data(this.links)
            .enter().append('g')
            .classed('link', true)

        newSvgLinks.append('path')
            .attr('id', (link: Link) => `${link.source.name}${link.target.name}`)
            .style('marker-end', 'url(#end-arrow)')

        newSvgLinks.append('text')
            .append('textPath')
            .attr('xlink:href', (link: Link) => `#${link.source.name}${link.target.name}`)
            .attr('startOffset', '50%')
            .append('tspan')
            .text((link: Link) => `${link.flow} / ${link.capacity}`)
            .attr('dy', -10)

        /// Update new & existing links

        this.svgLinkRoot.selectAll('g').data(this.links)
            .on('mousedown', (event: Event, link: Link) => this.toggleSelectedLink(event, link))
            .select('tspan')
            .text((link: Link) => this.state.mode === Mode.EDIT
                ? String(link.capacity)
                : `${link.flow} / ${link.capacity}`)

        /// Handle deleted links

        this.svgLinkRoot.selectAll('g').data(this.links)
            .exit().remove()
    }

    /// DragLine methods

    startDragLine(node: Node) {
        this.dragStartNode = node

        this.svgDragLine
            .classed('hidden', false)
            .attr('x1', node.x)
            .attr('y1', node.y)
            .attr('x2', node.x)
            .attr('y2', node.y)
    }

    moveDragLine(event: Event) {
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

    cancelDragLine() {
        this.svgDragLine.classed('hidden', true)
        this.dragStartNode = null
    }

    onCircleMouseUp(node: Node): void {
        if (node === this.dragStartNode) {
            this.toggleSelectedNode(node)
        } else {
            this.completeDragLine(node)
        }
    }

    toggleSelectedNode(node: Node): void {
        this.setState({selectedLink: null})

        // deselect potentially selected link
        const selectedNode = (this.state.selectedNode === node) ? null : node

        this.setState({selectedNode})
        this.updateSvgNodes()

        if (selectedNode) {
            this.focusNodeNameInput()
        }
    }

    toggleSelectedLink(event: Event, link: Link): void {
        event.stopPropagation()

        // deselect potentially selected node
        this.setState({selectedNode: null})
        this.updateSvgNodes()

        const selectedLink = (this.state.selectedLink === link) ? null : link
        this.setState({selectedLink})
        this.updateSvgLinks()

        if (selectedLink) {
            this.focusLinkCapacityInput()
        }
    }

    completeDragLine(node: Node) {
        if (this.dragStartNode === null || this.dragStartNode === node) {
            return
        }

        const sameLinks = this.links.filter((link: Link) =>
            link.source === this.dragStartNode && link.target === node)

        if (sameLinks.length === 0) {
            const newLink = {source: this.dragStartNode, target: node, capacity: 0, flow: 0}
            this.links.push(newLink)

            this.setState({selectedNode: null, selectedLink: newLink})

            this.updateSimLinks()
            this.updateSvgLinks()
            this.restartSim()

            this.focusLinkCapacityInput()
        }
    }

    /// spawnNode()

    spawnNode(event: Event): void {
        if (this.nodes.length >= 26) {
            return
        }

        if (this.dragStartNode !== null) {
            return
        }

        const [x, y] = d3.pointer(event);
        const node = {name: this.getNextNodeName(), x, y, color: this.colors(String(this.nextNodeColor))}
        this.nodes.push(node)

        this.nextNodeName = String.fromCharCode(this.nextNodeName.charCodeAt(0) + 1)
        this.nextNodeColor = (this.nextNodeColor + 1) % 10

        this.setState({selectedNode: node, selectedLink: null})

        this.updateSimNodes()
        this.updateSvgNodes()
        this.restartSim()

        this.focusNodeNameInput()
    }

    focusNodeNameInput(): void {
        setTimeout(() => {
            this.nodeNameInput.current!.focus()
            this.nodeNameInput.current!.select()
        }, 1)
    }

    focusLinkCapacityInput(): void {
        setTimeout(() => {
            this.linkCapacityInput.current!.focus()
            this.linkCapacityInput.current!.select()
        }, 1)
    }

    /// Simulation.tick()

    tick(): void {
        const svgLinks = this.svgLinkRoot.selectAll('.link').select('path').data(this.links)

        svgLinks.attr('d', (link: Link) => {
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

        this.svgNodeRoot.selectAll('g').data(this.nodes)
            .attr('transform', (node: Node) => `translate(${node.x},${node.y})`)
    }

    oppositeLinkExists(link: Link): boolean {
        for (const l of this.links) {
            if (l.source === link.target && l.target === link.source) {
                return true
            }
        }

        return false
    }

    getLink = (fulkersonLink: any) => {
        return {
            source: this.nodes[fulkersonLink.source],
            target: this.nodes[fulkersonLink.target],
            capacity: fulkersonLink.capacity,
            flow: fulkersonLink.flow
        }
    }

    /// Delete nodes & links

    deleteSelectedNode(): void {
        const selectedNode = this.state.selectedNode!

        this.deleteNodeLinks(selectedNode)

        this.nodes = this.nodes.filter(node => node !== selectedNode)
        this.updateSimNodes()
        this.updateSvgNodes()

        this.setState({selectedNode: null})

        this.restartSim()
    }

    deleteNodeLinks(node: Node) {
        const deleteLinks = this.links.filter(link => link.source === node || link.target === node)
        this.links = this.links.filter(link => !deleteLinks.includes(link))

        this.updateSimLinks()
        this.updateSvgLinks()
    }

    deleteSelectedLink(): void {
        const selectedLink = this.state.selectedLink!

        this.links = this.links.filter(link => link !== selectedLink)
        this.updateSimLinks()
        this.updateSvgLinks()

        this.setState({selectedLink: null})

        this.restartSim()
    }

    /// Render

    render() {
        return (
            <div id="graph-editor">
                <svg ref={this.svg}/>

                {this.state.mode === Mode.EDIT && this.state.selectedNode && this.renderNodeWidget()}
                {this.state.mode === Mode.EDIT && this.state.selectedLink && this.renderLinkWidget()}
                {this.state.mode === Mode.EDIT && this.renderSolveButton()}

                {this.state.mode === Mode.SOLUTION && this.renderFlowWidget()}
                {this.state.mode === Mode.SOLUTION && this.renderStepper()}
                {this.state.mode === Mode.SOLUTION && this.renderEditButton()}
            </div>
        )
    }

    renderFlowWidget(): ReactElement | void {
        const logs = this.logs!
        const currentStep = this.state.currentStep!

        const maxFlow = logs[currentStep].maxFlow

        return (
            <div id="flow" className="widget widget-bg">
                Flow: {maxFlow}
            </div>
        )
    }

    renderNodeWidget(): ReactElement {
        const selectedNode = this.state.selectedNode!

        return (
            <table id="node-widget" className="widget widget-bg">
                <tbody>
                <tr>
                    <td>
                        <label htmlFor="node-name-input">Node Name</label>
                    </td>
                    <td>
                        <input id="node-name-input" ref={this.nodeNameInput}
                               type="text" minLength={1} maxLength={2}
                               value={selectedNode.name}
                               onChange={this.setNodeName}/>
                    </td>
                </tr>
                <tr>
                    <td colSpan={2}>
                        <button className="danger-button"
                                disabled={this.state.selectedNode === this.sourceNode
                                    || this.state.selectedNode === this.sinkNode}
                                onClick={this.deleteSelectedNode}>

                            Delete Node
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
        )
    }

    renderLinkWidget(): ReactElement {
        const selectedLink = this.state.selectedLink!

        return (
            <table id="link-widget" className="widget widget-bg">
                <tbody>
                <tr>
                    <td>
                        <label htmlFor="link-capacity-input">Link Capacity</label>
                    </td>
                    <td>
                        <input id="link-capacity-input" ref={this.linkCapacityInput}
                               type="number" min={0} max={99}
                               value={selectedLink.capacity}
                               onChange={this.setLinkCapacity}/>
                    </td>
                </tr>
                <tr>
                    <td colSpan={2}>
                        <button className="danger-button"
                                onClick={this.deleteSelectedLink}>

                            Delete Link
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
        )
    }

    renderStepper(): ReactElement {
        return (
            <Stepper stepCount={this.logs!.length}
                     onCurrentStepChange={(currentStep: number) => {
                         this.setState({currentStep}, () => this.drawGraphAtStep(currentStep))
                     }}/>
        )
    }

    renderEditButton(): ReactElement {
        return (
            <button id="edit-button" className="widget warning-button"
                    onClick={this.edit}>Edit</button>
        )
    }

    renderSolveButton(): ReactElement {
        return (
            <button id="solve-button" className="widget confirm-button"
                    onClick={this.solve}>Solve</button>
        )
    }
}

export default GraphEditor
