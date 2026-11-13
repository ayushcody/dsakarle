def sift_down(nums, i, size):
    while 2 * i + 1 < size:
        child = 2 * i + 1                           # @sift
        if child + 1 < size and nums[child + 1] > nums[child]:  # @sift
            child += 1                              # @sift
        if nums[child] <= nums[i]:                  # @sift
            return
        nums[i], nums[child] = nums[child], nums[i] # @swap
        i = child                                   # @swap


def heap_sort(nums):
    n = len(nums)
    for start in range(n // 2 - 1, -1, -1):
        sift_down(nums, start, n)                   # @build
    for end in range(n - 1, 0, -1):
        nums[0], nums[end] = nums[end], nums[0]     # @extract
        sift_down(nums, 0, end)                     # @shrink
    return nums                                     # @done
