def quick_sort(nums):
    sort_range(nums, 0, len(nums) - 1)          # @init
    return nums                                 # @done


def sort_range(nums, lo, hi):
    if lo >= hi:                                # @base
        return                                  # @base
    pivot = nums[hi]                            # @pivot
    i = lo                                      # @pivot
    for j in range(lo, hi):                     # @scan
        if nums[j] < pivot:                     # @scan
            nums[i], nums[j] = nums[j], nums[i] # @swap
            i += 1                              # @swap
    nums[i], nums[hi] = nums[hi], nums[i]       # @place
    sort_range(nums, lo, i - 1)                 # @recurse
    sort_range(nums, i + 1, hi)                 # @recurse
