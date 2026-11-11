def search(nums, target):
    lo, hi = 0, len(nums) - 1                   # @init
    while lo <= hi:
        mid = lo + (hi - lo) // 2               # @mid
        if nums[mid] == target:                 # @check
            return mid                          # @done
        if nums[lo] <= nums[mid]:               # @which
            if nums[lo] <= target < nums[mid]:  # @inside
                hi = mid - 1                    # @go-left
            else:
                lo = mid + 1                    # @go-right
        else:
            if nums[mid] < target <= nums[hi]:  # @inside
                lo = mid + 1                    # @go-right
            else:
                hi = mid - 1                    # @go-left
    return -1                                   # @done
