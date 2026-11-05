def find_min(nums):
    lo, hi = 0, len(nums) - 1           # @init
    while lo < hi:
        mid = lo + (hi - lo) // 2       # @mid
        if nums[mid] > nums[hi]:        # @compare
            lo = mid + 1                # @go-right
        else:
            hi = mid                    # @go-left
    return nums[lo]                     # @done
