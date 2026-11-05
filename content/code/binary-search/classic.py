def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1               # @init
    while lo <= hi:
        mid = lo + (hi - lo) // 2           # @mid
        if nums[mid] == target:             # @check
            return mid                      # @done
        elif nums[mid] < target:            # @check
            lo = mid + 1                    # @go-right
        else:
            hi = mid - 1                    # @go-left
    return -1                               # @done
