struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val, ListNode* next = nullptr) : val(val), next(next) {}
};

int traverse(ListNode* head) {
    int total = 0;                         // @init
    ListNode* curr = head;                 // @init
    while (curr != nullptr) {              // @check
        total += curr->val;                // @visit
        curr = curr->next;                 // @advance
    }
    return total;                          // @done
}
