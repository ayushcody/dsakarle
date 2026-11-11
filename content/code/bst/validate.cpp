struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val, TreeNode* left = nullptr, TreeNode* right = nullptr) : val(val), left(left), right(right) {}
};

// lo and hi point at the bounds, or are nullptr when there is no bound yet.
// That way even INT_MIN and INT_MAX are valid node values.
bool check(TreeNode* node, const int* lo, const int* hi) {
    if (node == nullptr) {
        return true;
    }
    if (lo != nullptr && node->val <= *lo) {
        return false;
    }
    if (hi != nullptr && node->val >= *hi) {
        return false;
    }
    return check(node->left, lo, &node->val) && check(node->right, &node->val, hi);
}

bool isValidBST(TreeNode* root) {
    return check(root, nullptr, nullptr);
}
