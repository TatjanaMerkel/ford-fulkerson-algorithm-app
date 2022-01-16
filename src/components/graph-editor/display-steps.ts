import {Link, LogEntry} from '../../ford-fulkerson/ford-fulkerson'

interface DisplayLink {
    source: number
    target: number
    flow: number
    capacity: number

    isOnPath: boolean
    isBottleneck: boolean
    isAugmented: boolean
}

type DisplayStep = DisplayLink[]

function getDisplaySteps(logs: LogEntry[]): DisplayStep[] {
    const displaySteps = []

    for (const log of logs.slice(0, logs.length - 1)) {
        const displayLinks = log.links.map(link => ({
            ...link,
            isOnPath: false,
            isBottleneck: false,
            isAugmented: false
        }))

        const displayLinksWithPath = JSON.parse(JSON.stringify(displayLinks))
        for (const displayLink of displayLinksWithPath) {
            if (pathContainsLink(log.path!, displayLinkToLink(displayLink))) {
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

        displaySteps.push(displayLinks)
        displaySteps.push(displayLinksWithPath)
        displaySteps.push(displayLinksWithBottleneck)
        displaySteps.push(displayLinksAugmented)
    }

    const lastStepDisplayLinks = logs[logs.length - 1].links.map(link => ({
        ...link,
        isOnPath: false,
        isBottleneck: false,
        isAugmented: false
    }))

    displaySteps.push(lastStepDisplayLinks)

    return displaySteps
}

function pathContainsLink(path: number[], link: Link) {
    let firstNode = path[0]

    for (let secondNode of path.slice(1)) {
        if (firstNode === link.source && secondNode === link.target) {
            return true
        }

        firstNode = secondNode
    }

    return false
}

function displayLinkToLink(displayLink: DisplayLink): Link {
    return {
        source: displayLink.source,
        target: displayLink.target,
        flow: displayLink.flow,
        capacity: displayLink.capacity
    }
}

export {getDisplaySteps}
export type {DisplayLink, DisplayStep}
