struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val = 0, ListNode* next = nullptr) : val(val), next(next) {}
};

ListNode* mergeSorted(ListNode* a, ListNode* b) {
    ListNode dummy;                            // @init
    ListNode* tail = &dummy;                   // @init
    while (a != nullptr && b != nullptr) {     // @stop
        if (a->val <= b->val) {                // @compare
            tail->next = a;                    // @attach
            a = a->next;                       // @attach
        } else {
            tail->next = b;                    // @attach
            b = b->next;                       // @attach
        }
        tail = tail->next;                     // @advance
    }
    tail->next = (a != nullptr) ? a : b;       // @leftover
    return dummy.next;                         // @done
}
