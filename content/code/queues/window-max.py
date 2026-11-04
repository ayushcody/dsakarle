from collections import deque


def max_sliding_window(nums, k):
    dq = deque()                                        # @init
    out = []                                            # @init
    for i in range(len(nums)):
        if dq and dq[0] == i - k:                       # @expire
            dq.popleft()                                # @expire
        while dq and nums[dq[-1]] < nums[i]:            # @pop-back
            dq.pop()                                    # @pop-back
        dq.append(i)                                    # @push
        if i >= k - 1:
            out.append(nums[dq[0]])                     # @record
    return out                                          # @done
