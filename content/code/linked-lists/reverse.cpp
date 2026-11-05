struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val, ListNode* next = nullptr) : val(val), next(next) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;              // @init
    ListNode* curr = head;                 // @init
    while (curr != nullptr) {              // @check
        ListNode* nxt = curr->next;        // @save
        curr->next = prev;                 // @flip
        prev = curr;                       // @advance
        curr = nxt;                        // @advance
    }
    return prev;                           // @done
}
