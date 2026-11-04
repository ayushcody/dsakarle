#include <optional>
#include <vector>

struct CircularQueue {
    int capacity;
    std::vector<int> buf;
    int front;
    int back;
    int size;

    explicit CircularQueue(int cap) {
        capacity = cap;                                 // @init
        buf.assign(cap, 0);                             // @init
        front = 0;                                      // @init
        back = cap - 1;                                 // @init
        size = 0;                                       // @init
    }

    bool enqueue(int x) {
        if (size == capacity) {                         // @full
            return false;                               // @full
        }
        back = (back + 1) % capacity;                   // @enqueue
        buf[back] = x;                                  // @enqueue
        size++;                                         // @enqueue
        return true;                                    // @enqueue
    }

    std::optional<int> dequeue() {
        if (size == 0) {                                // @empty
            return std::nullopt;                        // @empty
        }
        int x = buf[front];                             // @dequeue
        front = (front + 1) % capacity;                 // @dequeue
        size--;                                         // @dequeue
        return x;                                       // @dequeue
    }
};
