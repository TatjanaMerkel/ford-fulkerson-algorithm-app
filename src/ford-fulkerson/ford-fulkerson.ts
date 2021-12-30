type Node = number

interface Link {
    source: Node
    target: Node
    capacity: number
}

interface ResidualLink {
    target: Node
    flow: number
}

interface Flow {
    maxFlow: number
    nodes: Node[]
    links: Link[]
}

interface LogEntry {
    flow: Flow
    residualGraph: ResidualGraph
    path: Node[]
}

type ResidualGraph = Map<Node, ResidualLink[]>

function fordFulkerson(nodes: Node[], links: Link[]) {

    const resGraph = createResidualGraph(nodes, links)
    const log: LogEntry[] = []

    let path = findAugmentingPath(resGraph)
    logState(resGraph, path, log)

    while (path !== null) {
        augment(path, resGraph)

        path = findAugmentingPath(resGraph)
        logState(resGraph, path, log)
    }
}

function createResidualGraph(nodes: Node[], links: Link[]): ResidualGraph {
    const resGraph = new Map<Node, ResidualLink[]>()

    for (const link of links) {
        const sourceResLinks = resGraph.get(link.source) || []
        const sourceResLink = {target: link.target, flow: link.capacity}
        sourceResLinks.push(sourceResLink)

        const targetResLinks = resGraph.get(link.target) || []
        const targetResLink = {target: link.source, flow: 0}
        targetResLinks.push(targetResLink)
    }

    return resGraph
}

const sourceNode = 0
const sinkNode = 1

function findAugmentingPath(residualGraph: ResidualGraph): Node[] | null {
    const visited = new Set<Node>()

    return depthFirstSearch([sourceNode], visited, residualGraph)
}

function depthFirstSearch(path: Node[], visited: Set<Node>, residualGraph: ResidualGraph): Node[] | null {
    const lastNode = path[path.length - 1]
    visited.add(lastNode)

    if (lastNode === sinkNode) {
        return path
    }

    // residual links with flow > 0
    const resLinks = residualGraph.get(lastNode)!.filter(resLink => resLink.flow > 0)

    if (resLinks.length === 0) {
        return null
    }

    for (const resLink of resLinks) {
        const targetNode = resLink.target

        if (!visited.has(targetNode)) {
            const newPath = path.slice(0)
            newPath.push(targetNode)

            const resultPath = depthFirstSearch(newPath, visited, residualGraph)

            if (resultPath !== null) {
                return resultPath
            }
        }
    }

    return null
}

function bottleneck(path: Node[], residualGraph: ResidualGraph): number {
    let minFlow = Infinity
    let source = path[0]

    for (let target of path.slice(1)) {
        const resLink = residualGraph.get(source)!.filter(resLink => resLink.target === target)[0]

        if (resLink.flow < minFlow) {
            minFlow = resLink.flow
        }

        source = target
    }

    return minFlow
}

function augment(path: Node[], residualGraph: ResidualGraph): void {

}

function logState(residualGraph: ResidualGraph, path: Node[] | null, log: LogEntry[]): void {

}

export {fordFulkerson}
