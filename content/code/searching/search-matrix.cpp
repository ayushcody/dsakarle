#include <vector>

bool searchMatrix(const std::vector<std::vector<int>>& matrix, int target) {
    int rows = (int)matrix.size();
    int cols = (int)matrix[0].size();
    int lo = 0;
    int hi = rows * cols - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int value = matrix[mid / cols][mid % cols];
        if (value == target) {
            return true;
        }
        if (value < target) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return false;
}
