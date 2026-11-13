#include <cstdlib>
#include <vector>

bool attacked(const std::vector<int>& cols, int row, int c) {
    for (int r = 0; r < row; r++) {
        if (cols[r] == c || std::abs(cols[r] - c) == row - r) {
            return true;
        }
    }
    return false;
}

bool place(int n, int row, std::vector<int>& cols) {
    if (row == n) {                                     // @solved
        return true;                                    // @solved
    }
    for (int c = 0; c < n; c++) {                             // @try
        if (attacked(cols, row, c)) {                   // @conflict
            continue;                                   // @conflict
        }
        cols.push_back(c);                              // @place
        if (place(n, row + 1, cols)) {           // @recurse
            return true;
        }
        cols.pop_back();                                // @unplace
    }
    return false;
}

std::vector<int> solveNQueens(int n) {
    std::vector<int> cols;                              // @init
    place(n, 0, cols);                           // @init
    return cols;                                        // @done
}
