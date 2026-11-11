def insertion_sort(nums):
    n = len(nums)                           # @init
    for i in range(1, n):
        key = nums[i]                       # @pick
        j = i - 1                           # @pick
        while j >= 0 and nums[j] > key:     # @compare
            nums[j + 1] = nums[j]           # @shift
            j -= 1                          # @shift
        nums[j + 1] = key                   # @place
    return nums                             # @done
