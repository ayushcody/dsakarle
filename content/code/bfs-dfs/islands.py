def count_islands(grid):
    rows, cols = len(grid), len(grid[0])
    label = [[0] * cols for _ in range(rows)]                 # @init
    count = 0                                                 # @init
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != '1':                             # @scan
                continue                                      # @scan
            if label[r][c] != 0:                              # @counted
                continue                                      # @counted
            count += 1                                        # @island
            label[r][c] = count                               # @island
            stack = [(r, c)]                                  # @island
            while stack:
                cr, cc = stack.pop()                          # @visit
                for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
                        continue
                    if grid[nr][nc] != '1' or label[nr][nc] != 0:
                        continue
                    label[nr][nc] = count                     # @push
                    stack.append((nr, nc))                    # @push
    return count                                              # @done
