def first_true(nums, target):
    lo, hi = 0, len(nums)                   # @init
    while lo < hi:
        mid = lo + (hi - lo) // 2           # @mid
        if nums[mid] >= target:             # @check
            hi = mid                        # @keep
        else:
            lo = mid + 1                    # @skip
    return lo                               # @done
