import {LogEntry} from '../../ford-fulkerson/ford-fulkerson'
import {Command} from "./graph-editor";

interface DisplayLink {
    source: number
    target: number
    flow: number | null
    capacity: number

    isOnPath: boolean
    isOnPathReverse: boolean
    isBottleneck: boolean
    isBottleneckReverse: boolean
    isAugmented: boolean
    isAugmentedReverse: boolean
}

interface DisplayStep {
    links: DisplayLink[]
    command: Command | null
    maxFlowAddends: number[]
}

function getDisplaySteps(logs: LogEntry[]): DisplayStep[] {
    const displaySteps: DisplayStep[] = []

    const firstStepDisplayLinks = logs[0].links.map(link => ({
        ...link,
        flow: null,
        isOnPath: false,
        isOnPathReverse: false,
        isBottleneck: false,
        isBottleneckReverse: false,
        isAugmented: false,
        isAugmentedReverse: false
    }))

    displaySteps.push({
        links: firstStepDisplayLinks,
        command: Command.COMMAND_1,
        maxFlowAddends: []
    })

    let prevMaxFlow = 0

    for (const log of logs.slice(0, logs.length - 1)) {
        const displayLinks = log.links.map(link => ({
            ...link,
            isOnPath: false,
            isOnPathReverse: false,
            isBottleneck: false,
            isBottleneckReverse: false,
            isAugmented: false,
            isAugmentedReverse: false
        }))

        const displayLinksWithPath = JSON.parse(JSON.stringify(displayLinks))
        for (const displayLink of displayLinksWithPath) {
            if (pathContainsDisplayLink(log.path!, log.pathLinks, displayLink)) {
                displayLink.isOnPath = true
            } else if (pathContainsReverseDisplayLink(log.path!, log.pathLinks, displayLink)) {
                displayLink.isOnPathReverse = true
            }
        }

        const displayLinksWithBottleneck = JSON.parse(JSON.stringify(displayLinksWithPath))
        let bottleneckLinks = []
        let bottleneckLinksReverse = []
        let bottleneck = Infinity
        for (const displayLink of displayLinksWithBottleneck) {
            if (displayLink.isOnPath) {
                const remainingCapacity = displayLink.capacity - displayLink.flow
                if (remainingCapacity < bottleneck) {
                    bottleneckLinks = [displayLink]
                    bottleneckLinksReverse = []
                    bottleneck = remainingCapacity
                } else if (remainingCapacity === bottleneck) {
                    bottleneckLinks.push(displayLink)
                }
            } else if (displayLink.isOnPathReverse) {
                const remainingCapacity = displayLink.flow
                if (remainingCapacity < bottleneck) {
                    bottleneckLinksReverse = [displayLink]
                    bottleneckLinks = []
                    bottleneck = remainingCapacity
                } else if (remainingCapacity === bottleneck) {
                    bottleneckLinksReverse.push(displayLink)
                }
            }
        }

        for (const bottleneckLink of bottleneckLinks) {
            bottleneckLink.isBottleneck = true
        }

        for (const bottleneckLinkReverse of bottleneckLinksReverse) {
            bottleneckLinkReverse.isBottleneckReverse = true
        }

        const displayLinksAugmented = JSON.parse(JSON.stringify(displayLinksWithBottleneck))
        for (const displayLink of displayLinksAugmented) {
            if (displayLink.isOnPath) {
                displayLink.flow += bottleneck
                displayLink.isAugmented = true
            } else if (displayLink.isOnPathReverse) {
                displayLink.flow -= bottleneck
                displayLink.isAugmentedReverse = true
            }
        }

        const maxFlowDelta = log.maxFlow - prevMaxFlow
        prevMaxFlow = log.maxFlow

        const prevMaxFlowAddends: number[] = displaySteps[displaySteps.length - 1].maxFlowAddends
        const nextMaxFlowAddends: number[] = [...prevMaxFlowAddends, maxFlowDelta]

        displaySteps.push({links: displayLinks, command: Command.COMMAND_2_1, maxFlowAddends: nextMaxFlowAddends})
        displaySteps.push({links: displayLinksWithPath, command: Command.COMMAND_2_2, maxFlowAddends: nextMaxFlowAddends})
        displaySteps.push({links: displayLinksWithBottleneck, command: Command.COMMAND_2_3, maxFlowAddends: nextMaxFlowAddends})
        displaySteps.push({links: displayLinksAugmented, command: Command.COMMAND_2_4, maxFlowAddends: nextMaxFlowAddends})
    }

    const lastStepDisplayLinks = logs[logs.length - 1].links.map(link => ({
        ...link,
        isOnPath: false,
        isOnPathReverse: false,
        isBottleneck: false,
        isBottleneckReverse: false,
        isAugmented: false,
        isAugmentedReverse: false
    }))

    const maxFlowDelta = logs[logs.length - 1].maxFlow - prevMaxFlow

    const prevMaxFlowAddends: number[] = displaySteps[displaySteps.length - 1].maxFlowAddends
    const nextMaxFlowAddends: number[] = [...prevMaxFlowAddends, maxFlowDelta]

    displaySteps.push({
        links: lastStepDisplayLinks,
        command: Command.COMMAND_RESULT,
        maxFlowAddends: nextMaxFlowAddends
    })

    return displaySteps
}

function pathContainsDisplayLink(path: number[], pathLinks: any, link: DisplayLink) {
    let firstNode = path[0]

    for (let i = 1; i < path.length; i++) {
        const secondNode = path[i]
        const linkToSecondNode = pathLinks[i]

        if (firstNode === link.source && secondNode === link.target && firstNode === linkToSecondNode.source) {
            return true
        }

        firstNode = secondNode
    }

    return false
}

function pathContainsReverseDisplayLink(path: number[], pathLinks: any, link: DisplayLink) {
    let firstNode = path[0]

    for (let i = 1; i < path.length; i++) {
        const secondNode = path[i]
        const linkToSecondNode = pathLinks[i]

        if (firstNode === link.target && secondNode === link.source && firstNode === linkToSecondNode.target) {
            return true
        }

        firstNode = secondNode
    }

    return false
}

export {getDisplaySteps}
export type {DisplayLink, DisplayStep}
