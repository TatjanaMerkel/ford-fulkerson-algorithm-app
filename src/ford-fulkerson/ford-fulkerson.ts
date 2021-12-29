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

function fordFulkerson(nodes: Node[], links: Link[]) {

}

function createResidualGraph(nodes: Node[], links: Link[]): Map<Node, ResidualLink[]> {
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

export {fordFulkerson}
