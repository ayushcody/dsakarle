def erase_overlap_intervals(intervals):
    intervals.sort(key=lambda iv: iv[1])    # @sort
    removed = 0                             # @init
    last_end = float("-inf")                # @init
    for start, end in intervals:
        if start >= last_end:               # @check
            last_end = end                  # @keep
        else:
            removed += 1                    # @drop
    return removed                          # @done
