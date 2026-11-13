def largest_rectangle(heights):
    best = 0                                          # @init
    stack = []                                        # @init
    n = len(heights)
    for i in range(n + 1):
        h = heights[i] if i < n else 0                # @flush
        while stack and heights[stack[-1]] > h:       # @compare
            j = stack.pop()                           # @pop
            left = stack[-1] + 1 if stack else 0      # @pop
            best = max(best, heights[j] * (i - left)) # @measure
        stack.append(i)                               # @push
    return best                                       # @done
