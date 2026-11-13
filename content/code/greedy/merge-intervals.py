def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])        # @sort
    merged = [intervals[0][:]]                  # @start
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:              # @check
            merged[-1][1] = max(merged[-1][1], end)     # @extend
        else:
            merged.append([start, end])         # @push
    return merged                               # @done
