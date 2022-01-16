import './graph-editor.scss'
import * as d3 from 'd3'
import {Simulation} from 'd3'
import React, {ChangeEvent, ReactElement, RefObject} from 'react'
import Stepper from '../Stepper/Stepper'
import {fordFulkerson} from '../../ford-fulkerson/ford-fulkerson'
import {DisplayLink, DisplayStep, getDisplaySteps} from "./display-steps";

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
    mode: Mode

    nodes: Node[]
    links: Link[]

    selectedNode: null | Node
    selectedLink: null | Link

    dragStartNode: null | Node
    dragLine: {
        x1: number
        y1: number
        x2: number
        y2: number
    }

    currentStep: null | number
    displaySteps: null | DisplayStep[]
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

    simulation!: Simulation<any, any>

    constructor(props: any) {
        super(props)

        const nodes = [
            this.sourceNode,
            this.sinkNode,
            {name: 'B', x: 300, y: 200, color: this.colors(String(this.nextNodeColor++))},
            {name: 'C', x: 300, y: 200, color: this.colors(String(this.nextNodeColor++))}
        ]

        const links = [
            {source: nodes[0], target: nodes[2], capacity: 3, flow: 0},
            {source: nodes[2], target: nodes[1], capacity: 2, flow: 0},
            {source: nodes[0], target: nodes[3], capacity: 2, flow: 0},
            {source: nodes[3], target: nodes[1], capacity: 4, flow: 0},
            {source: nodes[2], target: nodes[3], capacity: 2, flow: 0},
            {source: nodes[3], target: nodes[2], capacity: 3, flow: 0}
        ]

        this.state = {
            mode: Mode.EDIT,

            nodes,
            links,

            selectedNode: null,
            selectedLink: null,

            dragStartNode: null,
            dragLine: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            },

            currentStep: null,
            displaySteps: null
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
        this.spawnNode = this.spawnNode.bind(this)
        this.moveDragLine = this.moveDragLine.bind(this)
        this.cancelDragLine = this.cancelDragLine.bind(this)
    }

    /// componentDidMount()

    componentDidMount() {
        const svgRef = this.svg.current!

        this.simulation = d3.forceSimulation(this.state.nodes)
            .force('charge', d3.forceManyBody().strength(-1000))
            .force('x', d3.forceX(svgRef.clientWidth / 2))
            .force('y', d3.forceY(svgRef.clientHeight / 2))
            .on('tick', this.tick)

        this.simulation.restart()
    }

    /// Simulation

    updateSimNodes(): void {
        this.simulation.nodes(this.state.nodes)
    }

    updateSimLinks(): void {
        this.simulation.force('link', d3.forceLink(this.state.links).distance(200))
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
        return this.state.nodes.find(node => node.name === name) !== undefined
    }

    /// Event handlers

    setNodeName(event: ChangeEvent<HTMLInputElement>): void {
        const newName = event.target.value

        const selectedNode = this.state.selectedNode

        if (selectedNode !== null) {
            selectedNode.name = newName
            this.setState({selectedNode})
        }
    }

    setLinkCapacity(event: ChangeEvent<HTMLInputElement>): void {
        const newLinkCapacity = Number(event.target.value)

        const selectedLink = this.state.selectedLink!

        selectedLink.capacity = newLinkCapacity
        this.setState({selectedLink})
    }

    solve(): void {
        const fulkersonNodes = this.state.nodes.map((value, index) => index)
        const fulkersonLinks = this.state.links.map(link => ({
            source: this.state.nodes.indexOf(link.source),
            target: this.state.nodes.indexOf(link.target),
            capacity: link.capacity,
            flow: 0
        }))

        const logs = fordFulkerson(fulkersonNodes, fulkersonLinks)

        const displaySteps = getDisplaySteps(logs)

        this.setState({mode: Mode.SOLUTION, displaySteps, currentStep: 0})
    }

    edit(): void {
        this.setState({currentStep: null})
        this.setState({mode: Mode.EDIT})
    }

    /// DragLine methods

    startDragLine(event: React.MouseEvent, node: Node) {
        event.stopPropagation()

        const dragStartNode = node
        const dragLine = {
            x1: node.x,
            y1: node.y,
            x2: node.x,
            y2: node.y
        }

        this.setState({dragStartNode, dragLine})
    }

    moveDragLine(event: React.MouseEvent<SVGSVGElement>) {
        if (this.state.dragStartNode === null) {
            return
        }

        const [x, y] = d3.pointer(event)

        const dragLine = {
            x1: this.state.dragStartNode.x,
            y1: this.state.dragStartNode.y,
            x2: x,
            y2: y
        }

        this.setState({dragLine})
    }

    cancelDragLine() {
        this.setState({dragStartNode: null})
    }

    onCircleMouseUp(node: Node): void {
        if (node === this.state.dragStartNode) {
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

        if (selectedNode) {
            this.focusNodeNameInput()
        }
    }

    toggleSelectedLink(event: React.MouseEvent, link: Link): void {
        event.stopPropagation()

        // deselect potentially selected node
        this.setState({selectedNode: null})

        const selectedLink = (this.state.selectedLink === link) ? null : link
        this.setState({selectedLink})

        if (selectedLink) {
            this.focusLinkCapacityInput()
        }
    }

    completeDragLine(node: Node) {
        if (this.state.dragStartNode === null || this.state.dragStartNode === node) {
            return
        }

        const sameLinks = this.state.links.filter((link: Link) =>
            link.source === this.state.dragStartNode && link.target === node)

        if (sameLinks.length === 0) {
            const newLink = {source: this.state.dragStartNode, target: node, capacity: 0, flow: 0}
            const links = this.state.links.slice()
            links.push(newLink)
            this.setState({links})

            this.setState({selectedNode: null, selectedLink: newLink})

            this.updateSimLinks()
            this.restartSim()

            this.focusLinkCapacityInput()
        }
    }

    /// spawnNode()

    spawnNode(event: React.MouseEvent<SVGSVGElement>): void {
        if (this.state.nodes.length >= 26) {
            return
        }

        if (this.state.dragStartNode !== null) {
            return
        }

        const [x, y] = d3.pointer(event);
        const node = {name: this.getNextNodeName(), x, y, color: this.colors(String(this.nextNodeColor))}
        const nodes = this.state.nodes
        nodes.push(node)
        this.setState({nodes})

        this.nextNodeName = String.fromCharCode(this.nextNodeName.charCodeAt(0) + 1)
        this.nextNodeColor = (this.nextNodeColor + 1) % 10

        this.setState({selectedNode: node, selectedLink: null})

        this.updateSimNodes()
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
        const nodes = this.state.nodes.slice()
        const links = this.state.links.slice()
        this.setState({nodes, links})
    }

    oppositeLinkExists(link: Link): boolean {
        for (const l of this.state.links) {
            if (l.source === link.target && l.target === link.source) {
                return true
            }
        }

        return false
    }

    getLink = (fulkersonLink: any) => {
        return {
            source: this.state.nodes[fulkersonLink.source],
            target: this.state.nodes[fulkersonLink.target],
            capacity: fulkersonLink.capacity,
            flow: fulkersonLink.flow
        }
    }

    /// Delete nodes & links

    deleteSelectedNode(): void {
        const selectedNode = this.state.selectedNode!

        this.deleteNodeLinks(selectedNode)

        const nodes = this.state.nodes.filter(node => node !== selectedNode)
        this.setState({nodes})
        this.updateSimNodes()

        this.setState({selectedNode: null})

        this.restartSim()
    }

    deleteNodeLinks(node: Node) {
        const deleteLinks = this.state.links.filter(link => link.source === node || link.target === node)
        const links = this.state.links.filter(link => !deleteLinks.includes(link))
        this.setState({links})

        this.updateSimLinks()
    }

    deleteSelectedLink(): void {
        const selectedLink = this.state.selectedLink!

        const links = this.state.links.filter(link => link !== selectedLink)
        this.setState({links})
        this.updateSimLinks()

        this.setState({selectedLink: null})

        this.restartSim()
    }

    /// Render

    getLinkPath(link: Link) {
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
    }

    render() {
        return (
            <div id='graph-editor'>
                {this.state.mode === Mode.EDIT &&
                    <svg ref={this.svg}
                         onContextMenu={(event => event.preventDefault())}
                         onMouseDown={(event) => this.spawnNode(event)}
                         onMouseMove={(event) => this.moveDragLine(event)}
                         onMouseUp={this.cancelDragLine}>

                        {this.renderDefs()}
                        {this.renderDragLine()}
                        {this.renderLinks()}
                        {this.renderNodes()}
                    </svg>
                }

                {this.state.mode === Mode.SOLUTION &&
                    <svg ref={this.svg}
                         className='solution-mode'
                         onContextMenu={(event => event.preventDefault())}>

                        {this.renderDefs()}
                        {this.renderDragLine()}
                        {this.renderStepLinks()}
                        {this.renderNodes()}
                    </svg>
                }

                {this.state.mode === Mode.EDIT && this.state.selectedNode && this.renderNodeWidget()}
                {this.state.mode === Mode.EDIT && this.state.selectedLink && this.renderLinkWidget()}
                {this.state.mode === Mode.EDIT && this.renderSolveButton()}

                {this.state.mode === Mode.SOLUTION && this.renderFlowWidget()}
                {this.state.mode === Mode.SOLUTION && this.renderStepper()}
                {this.state.mode === Mode.SOLUTION && this.renderEditButton()}
            </div>
        )
    }

    renderDefs(): ReactElement {
        return <>
            <defs>
                <marker id='end-arrow'
                        viewBox='0 -5 10 10'
                        refX={6}
                        markerWidth={3} markerHeight={3}
                        orient='auto'>

                    <path d='M 0 -5 L 10 0 L 0 5'/>
                </marker>

                <marker id='current-path-end-arrow'
                        viewBox='0 -5 10 10'
                        refX={6}
                        markerWidth={3} markerHeight={3}
                        orient='auto'>

                    <path d='M 0 -5 L 10 0 L 0 5'/>
                </marker>

                <marker id='bottleneck-link-end-arrow'
                        viewBox='0 -5 10 10'
                        refX={6}
                        markerWidth={3} markerHeight={3}
                        orient='auto'>

                    <path d='M 0 -5 L 10 0 L 0 5'/>
                </marker>
            </defs>
        </>
    }

    renderDragLine(): ReactElement {
        return <line className={`dragLine ${this.state.dragStartNode === null ? 'hidden' : ''}`}
                     x1={this.state.dragLine.x1}
                     y1={this.state.dragLine.y1}
                     x2={this.state.dragLine.x2}
                     y2={this.state.dragLine.y2}/>
    }

    renderLinks(): ReactElement {
        return <>
            {this.state.links.map((link, index) =>
                <g key={index}
                   className='link'
                   onMouseDown={(event => this.toggleSelectedLink(event, link))}>

                    <path id={`${link.source.name}${link.target.name}`}
                          d={this.getLinkPath(link)}/>

                    <text>
                        <textPath xlinkHref={`#${link.source.name}${link.target.name}`}
                                  startOffset='50%'>

                            <tspan dy={-10}>
                                {this.state.mode === Mode.EDIT
                                    ? String(link.capacity)
                                    : `${link.flow} / ${link.capacity}`}
                            </tspan>
                        </textPath>
                    </text>
                </g>
            )}
        </>
    }

    renderStepLinks(): ReactElement {
        const displayStep = this.state.displaySteps![this.state.currentStep!]

        return <>
            {displayStep.links.map((displayLink, index) =>
                <g key={index}
                   className='link'>

                    <path id={`${displayLink.source}${displayLink.target}`}
                          className={[
                              ...(displayLink.isOnPath ? ['current-path'] : []),
                              ...(displayLink.isBottleneck ? ['bottleneck'] : [])
                          ].join(' ')}
                          d={this.getLinkPath(this.displayLinkToLink(displayLink))}/>

                    <text>
                        <textPath xlinkHref={`#${displayLink.source}${displayLink.target}`}
                                  startOffset='50%'>

                            <tspan dy={-10}
                                   className={displayLink.isAugmented ? 'augmented' : ''}>
                                {this.state.mode === Mode.EDIT
                                    ? String(displayLink.capacity)
                                    : `${displayLink.flow} / ${displayLink.capacity}`}
                            </tspan>
                        </textPath>
                    </text>
                </g>
            )}
        </>
    }

    displayLinkToLink(displayLink: DisplayLink): Link {
        return {
            source: this.state.nodes[displayLink.source],
            target: this.state.nodes[displayLink.target],
            flow: displayLink.flow,
            capacity: displayLink.capacity
        }
    }

    renderNodes(): ReactElement {
        return <>
            {this.state.nodes.map((node, index) =>
                <g key={index}
                   className='node'
                   transform={`translate(${node.x},${node.y})`}>

                    {this.state.mode === Mode.EDIT &&
                        <circle r={20}
                                fill={node === this.state.selectedNode ? d3.rgb(node.color).brighter().toString() : node.color}
                                stroke={d3.rgb(node.color).darker().toString()}
                                onMouseDown={(event) => this.startDragLine(event, node)}
                                onMouseUp={() => this.onCircleMouseUp(node)}/>
                    }

                    {this.state.mode === Mode.SOLUTION &&
                        <circle r={20}
                                fill={node === this.state.selectedNode ? d3.rgb(node.color).brighter().toString() : node.color}
                                stroke={d3.rgb(node.color).darker().toString()}/>
                    }

                    <text style={{fill: node === this.sourceNode || node === this.sinkNode ? 'black' : 'white'}}>
                        {node.name}
                    </text>
                </g>
            )}
        </>
    }

    renderFlowWidget(): ReactElement {
        const displaySteps = this.state.displaySteps!
        const currentStep = this.state.currentStep!

        const maxFlow = displaySteps[currentStep].maxFlow

        return (
            <div id='flow' className='widget widget-bg'>
                Flow: {maxFlow}
            </div>
        )
    }

    renderNodeWidget(): ReactElement {
        const selectedNode = this.state.selectedNode!

        return (
            <table id='node-widget' className='widget widget-bg'>
                <tbody>
                <tr>
                    <td>
                        <label htmlFor='node-name-input'>Node Name</label>
                    </td>
                    <td>
                        <input id='node-name-input' ref={this.nodeNameInput}
                               type='text' minLength={1} maxLength={2}
                               value={selectedNode.name}
                               onChange={this.setNodeName}/>
                    </td>
                </tr>
                <tr>
                    <td colSpan={2}>
                        <button className='danger-button'
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
            <table id='link-widget' className='widget widget-bg'>
                <tbody>
                <tr>
                    <td>
                        <label htmlFor='link-capacity-input'>Link Capacity</label>
                    </td>
                    <td>
                        <input id='link-capacity-input' ref={this.linkCapacityInput}
                               type='number' min={0} max={99}
                               value={selectedLink.capacity}
                               onChange={this.setLinkCapacity}/>
                    </td>
                </tr>
                <tr>
                    <td colSpan={2}>
                        <button className='danger-button'
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
            <Stepper stepCount={this.state.displaySteps!.length}
                     onCurrentStepChange={(currentStep: number) => this.setState({currentStep})}/>
        )
    }

    renderEditButton(): ReactElement {
        return (
            <button id='edit-button' className='widget warning-button'
                    onClick={this.edit}>Edit</button>
        )
    }

    renderSolveButton(): ReactElement {
        return (
            <button id='solve-button' className='widget confirm-button'
                    onClick={this.solve}>Solve</button>
        )
    }
}

export {GraphEditor}
