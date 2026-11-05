struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val, ListNode* next = nullptr) : val(val), next(next) {}
};

ListNode* deleteValue(ListNode* head, int v) {
    ListNode dummy(0, head);                       // @init
    ListNode* prev = &dummy;                       // @init
    ListNode* curr = head;                         // @init
    while (curr != nullptr && curr->val != v) {    // @search
        prev = curr;                               // @advance
        curr = curr->next;                         // @advance
    }
    if (curr != nullptr) {
        prev->next = curr->next;                   // @bypass
        delete curr;                               // @bypass
    }
    return dummy.next;                             // @done
}
