#include <string>
#include <vector>

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val, TreeNode* left = nullptr, TreeNode* right = nullptr) : val(val), left(left), right(right) {}
};

void dfs(TreeNode* node, const std::string& order, std::vector<int>& out) {
    if (node == nullptr) {                                  // @base
        return;                                             // @base
    }
    if (order == "pre") out.push_back(node->val);           // @visit
    dfs(node->left, order, out);                            // @left
    if (order == "in") out.push_back(node->val);            // @visit
    dfs(node->right, order, out);                           // @right
    if (order == "post") out.push_back(node->val);          // @visit
    return;                                                 // @back
}

std::vector<int> dfsOrder(TreeNode* root, const std::string& order) {
    std::vector<int> out;
    dfs(root, order, out);                                  // @init
    return out;                                             // @done
}
