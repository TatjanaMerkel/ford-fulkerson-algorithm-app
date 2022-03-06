import {LogEntry} from '../../ford-fulkerson/ford-fulkerson'
import {Command} from "./graph-editor";

interface DisplayLink {
    source: number
    target: number
    flow: number | null
    capacity: number

    isOnPath: boolean
    isBottleneck: boolean
    isAugmented: boolean
}

interface DisplayStep {
    links: DisplayLink[]
    maxFlow: number
    command: Command | null
}

function getDisplaySteps(logs: LogEntry[]): DisplayStep[] {
    const displaySteps = []

    const firstStepDisplayLinks = logs[0].links.map(link => ({
        ...link,
        flow: null,
        isOnPath: false,
        isBottleneck: false,
        isAugmented: false
    }))

    displaySteps.push({links: firstStepDisplayLinks, maxFlow: 0, command: Command.COMMAND_1})

    for (const log of logs.slice(0, logs.length - 1)) {
        const displayLinks = log.links.map(link => ({
            ...link,
            isOnPath: false,
            isBottleneck: false,
            isAugmented: false
        }))

        const displayLinksWithPath = JSON.parse(JSON.stringify(displayLinks))
        for (const displayLink of displayLinksWithPath) {
            if (pathContainsDisplayLink(log.path!, displayLink)) {
                displayLink.isOnPath = true
            }
        }

        const displayLinksWithBottleneck = JSON.parse(JSON.stringify(displayLinksWithPath))
        let bottleneckLinks = []
        let bottleneck = Infinity
        for (const displayLink of displayLinksWithBottleneck) {
            if (displayLink.isOnPath) {
                const remainingCapacity = displayLink.capacity - displayLink.flow
                if (remainingCapacity < bottleneck) {
                    bottleneckLinks = [displayLink]
                    bottleneck = remainingCapacity
                } else if (remainingCapacity === bottleneck) {
                    bottleneckLinks.push(displayLink)
                }
            }
        }

        for (const bottleneckLink of bottleneckLinks) {
            bottleneckLink.isBottleneck = true
        }

        const displayLinksAugmented = JSON.parse(JSON.stringify(displayLinksWithBottleneck))
        for (const displayLink of displayLinksAugmented) {
            if (displayLink.isOnPath) {
                displayLink.flow += bottleneck
                displayLink.isAugmented = true
            }
        }

        displaySteps.push({links: displayLinks, maxFlow: log.maxFlow, command: Command.COMMAND_2_1})
        displaySteps.push({links: displayLinksWithPath, maxFlow: log.maxFlow, command: Command.COMMAND_2_2})
        displaySteps.push({links: displayLinksWithBottleneck, maxFlow: log.maxFlow, command: Command.COMMAND_2_3})
        displaySteps.push({links: displayLinksAugmented, maxFlow: log.maxFlow, command: Command.COMMAND_2_4})
    }

    const lastStepDisplayLinks = logs[logs.length - 1].links.map(link => ({
        ...link,
        isOnPath: false,
        isBottleneck: false,
        isAugmented: false
    }))

    displaySteps.push({links: lastStepDisplayLinks, maxFlow: logs[logs.length - 1].maxFlow, command: Command.COMMAND_RESULT})

    return displaySteps
}

function pathContainsDisplayLink(path: number[], link: DisplayLink) {
    let firstNode = path[0]

    for (let secondNode of path.slice(1)) {
        if (firstNode === link.source && secondNode === link.target) {
            return true
        }

        firstNode = secondNode
    }

    return false
}

export {getDisplaySteps}
export type {DisplayLink, DisplayStep}
