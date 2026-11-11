struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val, ListNode* next = nullptr) : val(val), next(next) {}
};

ListNode* detectCycle(ListNode* head) {
    ListNode* slow = head;                 // @init
    ListNode* fast = head;                 // @init
    while (fast != nullptr && fast->next != nullptr) {   // @check
        slow = slow->next;                 // @move
        fast = fast->next->next;           // @move
        if (slow == fast) {                // @meet
            slow = head;                   // @reset
            while (slow != fast) {         // @walk
                slow = slow->next;         // @walk
                fast = fast->next;         // @walk
            }
            return slow;                   // @done
        }
    }
    return nullptr;                        // @done
}
