#include <queue>
#include <vector>

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val, TreeNode* left = nullptr, TreeNode* right = nullptr) : val(val), left(left), right(right) {}
};

std::vector<std::vector<int>> levelOrder(TreeNode* root) {
    std::vector<std::vector<int>> result;
    std::queue<TreeNode*> queue;                            // @init
    if (root != nullptr) queue.push(root);                  // @init
    while (!queue.empty()) {                                // @check
        int size = static_cast<int>(queue.size());          // @level
        std::vector<int> level;
        for (int i = 0; i < size; i++) {
            TreeNode* node = queue.front();                 // @pop
            queue.pop();                                    // @pop
            level.push_back(node->val);                     // @visit
            if (node->left != nullptr) queue.push(node->left);      // @push
            if (node->right != nullptr) queue.push(node->right);    // @push
        }
        result.push_back(level);                            // @group
    }
    return result;                                          // @done
}
