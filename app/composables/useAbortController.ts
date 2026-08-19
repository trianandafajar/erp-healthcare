export function useAbortController() {
    let controller: AbortController | null = null

    function getSignal() {
        controller?.abort()
        controller = new AbortController()
        return controller.signal
    }

    function abort() {
        controller?.abort()
        controller = null
    }

    onUnmounted(abort)

    return { getSignal, abort }
}
