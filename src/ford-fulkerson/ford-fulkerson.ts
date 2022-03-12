type Node = number

interface Link {
    source: Node
    target: Node
    capacity: number
    flow: number
}

interface ResidualLink {
    link: Link
    target: Node
    residualCapacity: number
}

interface LogEntry {
    maxFlow: number
    nodes: Node[]
    links: Link[]
    residualGraph: ResidualGraph
    path: Node[] | null
    pathLinks: any
}

type ResidualGraph = Map<Node, ResidualLink[]>

function fordFulkerson(nodes: Node[], links: Link[]): LogEntry[] {

    const resGraph = createResidualGraph(nodes, links)
    const logs: LogEntry[] = []

    let pathAndLinks: any = findAugmentingPath(resGraph)
    let path = pathAndLinks.path
    let pathLinks = pathAndLinks.pathLinks
    setLinkFlows(resGraph, links)
    logState(resGraph, path, pathLinks, logs, nodes, links)

    while (path !== null) {
        augment(path, resGraph)

        pathAndLinks = findAugmentingPath(resGraph)
        path = pathAndLinks.path
        pathLinks = pathAndLinks.pathLinks
        setLinkFlows(resGraph, links)
        logState(resGraph, path, pathLinks, logs, nodes, links)
    }

    return logs
}

function createResidualGraph(nodes: Node[], links: Link[]): ResidualGraph {
    const resGraph = new Map<Node, ResidualLink[]>()

    for (const link of links) {
        const sourceResLinks = resGraph.get(link.source) || []
        const sourceResLink = {link, target: link.target, residualCapacity: link.capacity}
        sourceResLinks.push(sourceResLink)
        resGraph.set(link.source, sourceResLinks)

        const targetResLinks = resGraph.get(link.target) || []
        const targetResLink = {link, target: link.source, residualCapacity: 0}
        targetResLinks.push(targetResLink)
        resGraph.set(link.target, targetResLinks)
    }

    return resGraph
}

const sourceNode = 0
const sinkNode = 1

function findAugmentingPath(residualGraph: ResidualGraph){
    const visited = new Set<Node>()

    return depthFirstSearch([sourceNode], [null], visited, residualGraph)
}

function depthFirstSearch(path: Node[], pathLinks: any, visited: Set<Node>, residualGraph: ResidualGraph) {
    const lastNode = path[path.length - 1]
    visited.add(lastNode)

    if (lastNode === sinkNode) {
        return {path, pathLinks}
    }

    // residual links with flow > 0
    const resLinks = residualGraph.get(lastNode)!.filter(resLink => resLink.residualCapacity > 0)

    if (resLinks.length === 0) {
        return {path: null, pathLinks: null}
    }

    for (const resLink of resLinks) {
        const targetNode = resLink.target

        if (!visited.has(targetNode)) {
            const newPath = path.slice(0)
            const newPathLinks = pathLinks.slice(0)
            newPath.push(targetNode)
            newPathLinks.push(resLink.link)

            const result: any = depthFirstSearch(newPath, newPathLinks, visited, residualGraph);
            const resultPath = result.path
            const resultPathLinks = result.pathLinks

            if (resultPath !== null) {
                return {path: resultPath, pathLinks: resultPathLinks}
            }
        }
    }

    return {path: null, pathLinks: null}
}

function bottleneck(path: Node[], residualGraph: ResidualGraph): number {
    let minFlow = Infinity

    iteratePath(path, residualGraph, (sourceResLink) => {
        minFlow = Math.min(minFlow, sourceResLink.residualCapacity)
    })

    return minFlow
}

function augment(path: Node[], residualGraph: ResidualGraph): void {
    const minFlow = bottleneck(path, residualGraph)

    iteratePath(path, residualGraph, (sourceResLink, targetResLink) => {
        sourceResLink.residualCapacity -= minFlow
        targetResLink.residualCapacity += minFlow
    })
}

function iteratePath(path: Node[],
                     residualGraph: ResidualGraph,
                     handler: (sourceResLink: ResidualLink, targetResLink: ResidualLink) => void
): void {
    let source = path[0]

    for (const target of path.slice(1)) {
        const sourceResLink = residualGraph.get(source)!.filter(resLink => resLink.target === target)[0]
        // eslint-disable-next-line no-loop-func
        const targetResLink = residualGraph.get(target)!.filter(resLink => resLink.target === source)[0]

        handler(sourceResLink, targetResLink)

        source = target
    }
}

function setLinkFlows(residualGraph: ResidualGraph, links: Link[]): void {
    for (const link of links) {
        const resLink = residualGraph.get(link.target)!.filter(resLink => resLink.link === link)[0]
        link.flow = resLink.residualCapacity
    }
}

function getTotalFlow(residualGraph: ResidualGraph): number {
    return residualGraph.get(sinkNode)!.reduce((acc: number, next: ResidualLink) => acc + next.residualCapacity, 0)
}

function logState(
    residualGraph: ResidualGraph,
    path: Node[] | null,
    pathLinks: any,
    logs: LogEntry[],
    nodes: Node[],
    links: Link[]
): void {
    logs.push({
        maxFlow: getTotalFlow(residualGraph),
        nodes: nodes,
        links: copy(links),
        path: copy(path),
        pathLinks: copy(pathLinks),
        residualGraph: copy(residualGraph)
    })
}

function copy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

export type {LogEntry, Link}
export {fordFulkerson}
