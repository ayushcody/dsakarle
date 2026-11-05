import heapq


def last_stone_weight(stones):
    heap = [-stone for stone in stones]      # Python only has a min-heap: store negatives
    heapq.heapify(heap)
    while len(heap) > 1:
        first = -heapq.heappop(heap)         # heaviest
        second = -heapq.heappop(heap)        # second heaviest
        if first != second:
            heapq.heappush(heap, -(first - second))
    return -heap[0] if heap else 0
