def selection_sort(nums):
    n = len(nums)                               # @init
    for i in range(n - 1):
        lowest = i                              # @outer
        for j in range(i + 1, n):
            if nums[j] < nums[lowest]:          # @scan
                lowest = j                      # @newmin
        nums[i], nums[lowest] = nums[lowest], nums[i]   # @swap
    return nums                                 # @done
