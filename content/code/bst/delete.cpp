struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val) : val(val), left(nullptr), right(nullptr) {}
};

TreeNode* deleteNode(TreeNode* root, int key) {
    TreeNode* parent = nullptr;                                  // @init
    TreeNode* curr = root;                                       // @init
    while (curr != nullptr && curr->val != key) {                // @search
        parent = curr;                                           // @walk
        curr = (key < curr->val) ? curr->left : curr->right;     // @walk
    }
    if (curr == nullptr) {
        return root;                                             // @done
    }
    if (curr->left != nullptr && curr->right != nullptr) {       // @case
        parent = curr;                                           // @successor
        TreeNode* succ = curr->right;                            // @successor
        while (succ->left != nullptr) {                          // @successor
            parent = succ;                                       // @successor
            succ = succ->left;                                   // @successor
        }
        curr->val = succ->val;                                   // @copy
        curr = succ;                                             // @copy
    }
    TreeNode* child = (curr->left != nullptr) ? curr->left : curr->right;   // @relink
    if (parent == nullptr) {
        root = child;                                            // @relink
    } else if (parent->left == curr) {
        parent->left = child;                                    // @relink
    } else {
        parent->right = child;                                   // @relink
    }
    delete curr;                                                 // @relink
    return root;                                                 // @done
}
