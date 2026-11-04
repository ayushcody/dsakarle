import heapq


def kth_largest(nums, k):
    heap = []                                 # @init
    for num in nums:
        heapq.heappush(heap, num)             # @push
        if len(heap) > k:
            heapq.heappop(heap)               # @pop
    return heap[0]                            # @done
