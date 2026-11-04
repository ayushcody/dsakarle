def merge_sort(nums):
    merged = [0] * len(nums)                        # @init
    sort_range(nums, merged, 0, len(nums) - 1)      # @init
    return nums                                     # @done


def sort_range(nums, merged, lo, hi):
    if lo >= hi:                                    # @base
        return                                      # @base
    mid = (lo + hi) // 2                            # @split
    sort_range(nums, merged, lo, mid)               # @split
    sort_range(nums, merged, mid + 1, hi)           # @split
    i, j, k = lo, mid + 1, lo                       # @merge
    while i <= mid and j <= hi:
        if nums[i] <= nums[j]:                      # @take
            merged[k] = nums[i]                     # @take
            i += 1                                  # @take
        else:
            merged[k] = nums[j]                     # @take
            j += 1                                  # @take
        k += 1                                      # @take
    while i <= mid:                                 # @drain
        merged[k] = nums[i]                         # @drain
        i += 1                                      # @drain
        k += 1                                      # @drain
    while j <= hi:                                  # @drain
        merged[k] = nums[j]                         # @drain
        j += 1                                      # @drain
        k += 1                                      # @drain
    for p in range(lo, hi + 1):                     # @copy
        nums[p] = merged[p]                         # @copy
