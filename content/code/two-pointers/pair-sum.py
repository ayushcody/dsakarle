def pair_sum(nums, target):
    left = 0                                # @init
    right = len(nums) - 1                   # @init
    while left < right:
        total = nums[left] + nums[right]    # @compare
        if total == target:                 # @found
            return [left + 1, right + 1]    # @done
        if total < target:                  # @move-left
            left += 1                       # @move-left
        else:
            right -= 1                      # @move-right
    return [-1, -1]                         # @done
