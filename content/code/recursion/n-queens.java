import java.util.ArrayList;
import java.util.List;

class Solution {
    private int n;
    private List<Integer> cols;

    List<Integer> solveNQueens(int n) {
        this.n = n;
        cols = new ArrayList<>();                       // @init
        place(0);                                       // @init
        return cols;                                    // @done
    }

    private boolean place(int row) {
        if (row == n) {                                 // @solved
            return true;                                // @solved
        }
        for (int c = 0; c < n; c++) {                         // @try
            if (attacked(row, c)) {                     // @conflict
                continue;                               // @conflict
            }
            cols.add(c);                                // @place
            if (place(row + 1)) {                       // @recurse
                return true;
            }
            cols.remove(cols.size() - 1);               // @unplace
        }
        return false;
    }

    private boolean attacked(int row, int c) {
        for (int r = 0; r < row; r++) {
            if (cols.get(r) == c || Math.abs(cols.get(r) - c) == row - r) {
                return true;
            }
        }
        return false;
    }
}
