def is_palindrome(s):
    left = 0                                        # @init
    right = len(s) - 1                              # @init
    while left < right:
        if not s[left].isalnum():                   # @skip
            left += 1                               # @skip
        elif not s[right].isalnum():                # @skip
            right -= 1                              # @skip
        elif s[left].lower() != s[right].lower():   # @compare
            return False                            # @done
        else:
            left += 1                               # @match
            right -= 1                              # @match
    return True                                     # @done
