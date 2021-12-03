import React from 'react'
import * as d3 from 'd3'
import './Nodes.css'

interface Node {
    id: number
    x: number
    y: number
}

interface Links {
    source: Node
    target: Node
}

class Nodes extends React.Component<any, any> {

    divRef: React.RefObject<HTMLDivElement>
    svg: any
    drag: any

    colors = d3.scaleOrdinal(d3.schemeCategory10)
    nodes = new Array<Node>()
    links = new Array<Links>()
    lastNodeId: number = 0
    simulation: any
    path: any
    circles: any
    selectedNode: any = null

    constructor(props: any) {
        super(props)
        this.divRef = React.createRef()
    }

    componentDidMount() {
        const width = 960
        const height = 500

        this.svg = d3.select(this.divRef.current)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('contextmenu', (event) => {
                event.preventDefault()
            })

        this.nodes = [
            {id: 0, x: 0, y: 0},
            {id: 1, x: 1, y: 1},
            {id: 2, x: 0, y: 2}
        ]

        this.lastNodeId = 2

        this.links = [
            {source: this.nodes[0], target: this.nodes[1]},
            {source: this.nodes[1], target: this.nodes[2]}
        ]

        // init D3 force layout
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id((d: any) => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2))
            .on('tick', () => this.tick())

        // define links for graph links
        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000')

        // handles to link and node element groups
        this.path = this.svg.append('svg:g').selectAll('path')
        this.circles = this.svg.append('svg:g').selectAll('g')

        // app starts here
        this.svg.on('mousedown', (event: Event) => this.mousedown(event))

        this.restart()
    }

    tick() {
        this.path.attr('d', (d: any) => {
            const deltaX = d.target.x - d.source.x
            const deltaY = d.target.y - d.source.y
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            const normX = deltaX / dist
            const normY = deltaY / dist
            const sourcePadding = 12
            const targetPadding = 17
            const sourceX = d.source.x + (sourcePadding * normX)
            const sourceY = d.source.y + (sourcePadding * normY)
            const targetX = d.target.x - (targetPadding * normX)
            const targetY = d.target.y - (targetPadding * normY)

            return `M${sourceX},${sourceY}L${targetX},${targetY}`
        })

        this.circles.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    }

    restart() {

        /* Links */
        // path (link) group
        this.path = this.path.data(this.links)

        // add new links
        this.path = this.path.join('svg:path')
            .attr('class', 'link')
            .merge(this.path)

        /* NODES */
        //binding the nodes
        this.circles = this.circles.data(this.nodes, (d: any) => d.id)

        // add new nodes
        const group = this.circles.join('svg:g')

        group.append('svg:circle')
            .attr('class', 'node')
            .attr('r', 20)
            .style('fill', (d: any) => (d === this.selectedNode) ? d3.rgb(this.colors(d.id)).brighter().toString() : this.colors(d.id))
            .style('stroke', (d: any) => d3.rgb(this.colors(d.id)).darker().toString())
            .call(this.drag)
            .on('click', (event: any, d: any) => {
                    this.selectedNode = d
                    this.restart()
                }
            )

        // show node IDs
        group.append('svg:text')
            .attr('x', 0)
            .attr('y', 4)
            .attr('class', 'id')
            .text((d: any) => d.id)

        this.circles = group.merge(this.circles)

        // set the graph in motion
        // selection.nodes(): return the array of selection that contains HTML elements
        this.simulation
            .nodes(this.nodes)

        this.simulation.alpha(1).restart()
    }

    mousedown(event: Event) {

        // insert new node at point
        const point = d3.pointer(event)
        const node = {id: ++this.lastNodeId, x: point[0], y: point[1]}
        this.nodes.push(node)

        this.restart()
    }

    render() {
        return (
            <div ref={this.divRef}/>
        )
    }
}

export default Nodes
