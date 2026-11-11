struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val) : val(val), left(nullptr), right(nullptr) {}
};

TreeNode* insertIntoBST(TreeNode* root, int val) {
    TreeNode* node = new TreeNode(val);        // @init
    if (root == nullptr) {
        return node;                           // @link
    }
    TreeNode* parent = nullptr;                // @init
    TreeNode* curr = root;                     // @init
    while (curr != nullptr) {
        if (val < curr->val) {                 // @compare
            parent = curr;                     // @left
            curr = curr->left;                 // @left
        } else {
            parent = curr;                     // @right
            curr = curr->right;                // @right
        }
    }
    if (val < parent->val) {                   // @link
        parent->left = node;                   // @link
    } else {
        parent->right = node;                  // @link
    }
    return root;                               // @done
}
