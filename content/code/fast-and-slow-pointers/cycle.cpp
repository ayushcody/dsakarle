struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val, ListNode* next = nullptr) : val(val), next(next) {}
};

bool hasCycle(ListNode* head) {
    ListNode* slow = head;                 // @init
    ListNode* fast = head;                 // @init
    while (fast != nullptr && fast->next != nullptr) {   // @check
        slow = slow->next;                 // @move
        fast = fast->next->next;           // @move
        if (slow == fast) {                // @meet
            return true;                   // @done
        }
    }
    return false;                          // @done
}
