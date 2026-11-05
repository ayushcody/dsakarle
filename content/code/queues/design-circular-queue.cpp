#include <vector>

class MyCircularQueue {
    int capacity;
    std::vector<int> buf;
    int front;
    int back;
    int size;

public:
    MyCircularQueue(int k) {
        capacity = k;                                   // @init
        buf.assign(k, 0);                               // @init
        front = 0;                                      // @init
        back = k - 1;                                   // @init
        size = 0;                                       // @init
    }

    bool enQueue(int value) {
        if (size == capacity) {                         // @full
            return false;                               // @full
        }
        back = (back + 1) % capacity;                   // @enqueue
        buf[back] = value;                              // @enqueue
        size++;                                         // @enqueue
        return true;                                    // @enqueue
    }

    bool deQueue() {
        if (size == 0) {                                // @empty
            return false;                               // @empty
        }
        front = (front + 1) % capacity;                 // @dequeue
        size--;                                         // @dequeue
        return true;                                    // @dequeue
    }

    int Front() {
        return size == 0 ? -1 : buf[front];
    }

    int Rear() {
        return size == 0 ? -1 : buf[back];
    }

    bool isEmpty() {
        return size == 0;
    }

    bool isFull() {
        return size == capacity;
    }
};
