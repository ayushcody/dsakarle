def longest_unique(s):
    seen = set()                            # @init
    left = 0                                # @init
    best = 0                                # @init
    for right in range(len(s)):
        while s[right] in seen:             # @check
            seen.remove(s[left])            # @shrink
            left += 1                       # @shrink
        seen.add(s[right])                  # @expand
        best = max(best, right - left + 1)  # @record
    return best                             # @done
