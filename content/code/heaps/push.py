def push(heap, value):
    heap.append(value)                                    # @append
    i = len(heap) - 1
    while i > 0 and heap[(i - 1) // 2] > heap[i]:         # @compare
        parent = (i - 1) // 2                             # @swap
        heap[i], heap[parent] = heap[parent], heap[i]     # @swap
        i = parent                                        # @swap
    return i                                              # @settle


def build_by_pushing(values):
    heap = []                                             # @init
    for value in values:
        push(heap, value)
    return heap                                           # @done
