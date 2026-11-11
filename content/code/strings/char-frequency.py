def is_anagram(s, t):
    if len(s) != len(t):                    # @lengths
        return False                        # @done
    counts = {}                             # @init
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1  # @count
    for ch in t:
        if counts.get(ch, 0) == 0:          # @check
            return False                    # @done
        counts[ch] -= 1                     # @spend
    return True                             # @done
