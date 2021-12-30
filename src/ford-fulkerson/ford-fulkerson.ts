type Node = number

interface Link {
    source: Node
    target: Node
    capacity: number
    flow: number
}

interface ResidualLink {
    target: Node
    flow: number
}

interface LogEntry {
    maxFlow: number
    nodes: Node[]
    links: Link[]
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

    iteratePath(path, residualGraph, (sourceResLink) => {
        minFlow = Math.min(minFlow, sourceResLink.flow)
    })

    return minFlow
}

function augment(path: Node[], residualGraph: ResidualGraph): void {
    const minFlow = bottleneck(path, residualGraph)

    iteratePath(path, residualGraph, (sourceResLink, targetResLink) => {
        sourceResLink.flow -= minFlow
        targetResLink.flow += minFlow
    })
}

function iteratePath(path: Node[],
                     residualGraph: ResidualGraph,
                     handler: (sourceResLink: ResidualLink, targetResLink: ResidualLink) => void
): void {
    let source = path[0]

    for (const target of path.slice(1)) {
        const sourceResLink = residualGraph.get(source)!.filter(resLink => resLink.target === target)[0]
        const targetResLink = residualGraph.get(target)!.filter(resLink => resLink.target === source)[0]

        handler(sourceResLink, targetResLink)

        source = target
    }
}

function logState(residualGraph: ResidualGraph, path: Node[] | null, log: LogEntry[]): void {

}

function setLinkFlows(residualGraph: ResidualGraph, links: Link[]): void {
    for (const link of links) {
        const resLink = residualGraph.get(link.target)!.filter(resLink => resLink.target === link.source)[0]
        link.flow = resLink.flow
    }
}

function getTotalFlow(residualGraph: ResidualGraph): number {
    return residualGraph.get(sinkNode)!.reduce((acc: number, next: ResidualLink) => acc + next.flow, 0)
}

export {fordFulkerson}
