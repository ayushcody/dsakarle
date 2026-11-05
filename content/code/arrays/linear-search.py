def linear_search(nums, target):
    for i in range(len(nums)):             # @next
        if nums[i] == target:              # @compare
            return i                       # @done
    return -1                              # @done
