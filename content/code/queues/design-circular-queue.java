class MyCircularQueue {
    int capacity;
    int[] buf;
    int front;
    int back;
    int size;

    MyCircularQueue(int k) {
        capacity = k;                                   // @init
        buf = new int[k];                               // @init
        front = 0;                                      // @init
        back = k - 1;                                   // @init
        size = 0;                                       // @init
    }

    boolean enQueue(int value) {
        if (size == capacity) {                         // @full
            return false;                               // @full
        }
        back = (back + 1) % capacity;                   // @enqueue
        buf[back] = value;                              // @enqueue
        size++;                                         // @enqueue
        return true;                                    // @enqueue
    }

    boolean deQueue() {
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

    boolean isEmpty() {
        return size == 0;
    }

    boolean isFull() {
        return size == capacity;
    }
}
