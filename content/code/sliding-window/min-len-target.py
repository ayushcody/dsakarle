def min_len_target(nums, target):
    window = 0                              # @init
    best = float('inf')                     # @init
    left = 0                                # @init
    for right in range(len(nums)):
        window += nums[right]               # @expand
        while window >= target:             # @check
            best = min(best, right - left + 1)  # @record
            window -= nums[left]            # @shrink
            left += 1                       # @shrink
    return 0 if best == float('inf') else best  # @done
