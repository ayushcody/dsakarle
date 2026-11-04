#include <vector>

int findJudge(int n, const std::vector<std::vector<int>>& trust) {
    std::vector<int> balance(n + 1, 0);
    for (const auto& t : trust) {
        balance[t[0]]--;
        balance[t[1]]++;
    }
    for (int person = 1; person <= n; person++) {
        if (balance[person] == n - 1) {
            return person;
        }
    }
    return -1;
}
