def sift_down(heap, i):
    n = len(heap)
    while 2 * i + 1 < n:
        child = 2 * i + 1                                   # @children
        if child + 1 < n and heap[child + 1] < heap[child]: # @children
            child += 1                                      # @children
        if heap[child] >= heap[i]:                          # @compare
            break
        heap[i], heap[child] = heap[child], heap[i]         # @swap
        i = child                                           # @swap
    return i                                                # @settle


def pop(heap):
    smallest = heap[0]                                      # @take
    last = heap.pop()                                       # @move
    if heap:
        heap[0] = last                                      # @move
        sift_down(heap, 0)
    return smallest


def pop_many(heap, pops):
    popped = []                                             # @init
    for _ in range(pops):
        popped.append(pop(heap))
    return popped                                           # @done
