struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val) : val(val), left(nullptr), right(nullptr) {}
};

TreeNode* searchBST(TreeNode* root, int key) {
    TreeNode* curr = root;                     // @init
    while (curr != nullptr) {
        if (key == curr->val) {                // @compare
            return curr;                       // @done
        }
        if (key < curr->val) {                 // @compare
            curr = curr->left;                 // @left
        } else {
            curr = curr->right;                // @right
        }
    }
    return nullptr;                            // @done
}
