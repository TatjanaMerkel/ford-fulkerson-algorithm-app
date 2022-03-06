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
    isAugmented: boolean
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
        isAugmented: false
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
            isAugmented: false
        }))

        const displayLinksWithPath = JSON.parse(JSON.stringify(displayLinks))
        for (const displayLink of displayLinksWithPath) {
            if (pathContainsDisplayLink(log.path!, displayLink)) {
                displayLink.isOnPath = true
            } else if (pathContainsReverseDisplayLink(log.path!, displayLink)) {
                displayLink.isOnPathReverse = true
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
        isAugmented: false
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

function pathContainsReverseDisplayLink(path: number[], link: DisplayLink) {
    let firstNode = path[0]

    for (let secondNode of path.slice(1)) {
        if (firstNode === link.target && secondNode === link.source) {
            return true
        }

        firstNode = secondNode
    }

    return false
}

export {getDisplaySteps}
export type {DisplayLink, DisplayStep}
