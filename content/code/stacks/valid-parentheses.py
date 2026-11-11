def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []                                        # @init
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:   # @check
                return False                          # @check
            stack.pop()                               # @pop
        else:
            stack.append(ch)                          # @push
    return not stack                                  # @done
