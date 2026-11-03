def max_sum_k(nums, k):
    window = 0                              # @init
    best = float('-inf')                    # @init
    left = 0                                # @init
    for right in range(len(nums)):
        window += nums[right]               # @expand
        if right - left + 1 > k:
            window -= nums[left]            # @shrink
            left += 1                       # @shrink
        if right - left + 1 == k:
            best = max(best, window)        # @record
    return best                             # @done
