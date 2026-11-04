#include <algorithm>

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val, TreeNode* left = nullptr, TreeNode* right = nullptr) : val(val), left(left), right(right) {}
};

int depth(TreeNode* node) {
    if (node == nullptr) {                          // @base
        return 0;                                   // @base
    }
    int left = depth(node->left);                   // @left
    int right = depth(node->right);                 // @right
    return 1 + std::max(left, right);               // @combine
}

int maxDepth(TreeNode* root) {
    return depth(root);                             // @init
}
