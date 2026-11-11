struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val, ListNode* next = nullptr) : val(val), next(next) {}
};

ListNode* middleNode(ListNode* head) {
    ListNode* slow = head;                 // @init
    ListNode* fast = head;                 // @init
    while (fast != nullptr && fast->next != nullptr) {   // @check
        slow = slow->next;                 // @move
        fast = fast->next->next;           // @move
    }
    return slow;                           // @done
}
