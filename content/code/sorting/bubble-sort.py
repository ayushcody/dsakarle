def bubble_sort(nums):
    n = len(nums)                               # @init
    for end in range(n - 1, 0, -1):
        swapped = False                         # @pass
        for j in range(end):
            if nums[j] > nums[j + 1]:           # @compare
                nums[j], nums[j + 1] = nums[j + 1], nums[j]   # @swap
                swapped = True                  # @swap
        if not swapped:                         # @check
            break                               # @early
    return nums                                 # @done
