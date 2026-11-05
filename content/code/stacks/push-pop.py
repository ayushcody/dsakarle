def run_ops(ops, values):
    stack = []                                        # @init
    outputs = []                                      # @init
    for i in range(len(ops)):
        if ops[i] == "push":
            stack.append(values[i])                   # @push
        elif not stack:
            outputs.append(None)                      # @underflow
        elif ops[i] == "pop":
            outputs.append(stack.pop())               # @pop
        else:
            outputs.append(stack[-1])                 # @peek
    return outputs                                    # @done
