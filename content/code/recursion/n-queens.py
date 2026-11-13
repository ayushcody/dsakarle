def solve_n_queens(n):
    cols = []                                       # @init

    def place(row):
        if row == n:                                # @solved
            return True                             # @solved
        for c in range(n):                            # @try
            if any(cols[r] == c or abs(cols[r] - c) == row - r for r in range(row)):  # @conflict
                continue                            # @conflict
            cols.append(c)                          # @place
            if place(row + 1):                      # @recurse
                return True
            cols.pop()                              # @unplace
        return False

    place(0)                                        # @init
    return cols                                     # @done
