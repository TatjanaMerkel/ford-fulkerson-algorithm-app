interface Node {
}

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

    while (path.length !== 0) {
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

function findAugmentingPath(residualGraph: ResidualGraph): Node[] {

    return []
}

function augment(path: Node[], residualGraph: ResidualGraph): void {

}

function logState(residualGraph: ResidualGraph, path: Node[], log: LogEntry[]): void {

}

export {fordFulkerson}
