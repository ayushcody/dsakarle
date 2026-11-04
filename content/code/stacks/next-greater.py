def daily_temperatures(temps):
    answer = [0] * len(temps)                         # @init
    stack = []                                        # @init
    for i in range(len(temps)):
        while stack and temps[stack[-1]] < temps[i]:  # @compare
            j = stack.pop()                           # @pop
            answer[j] = i - j                         # @pop
        stack.append(i)                               # @push
    return answer                                     # @done
