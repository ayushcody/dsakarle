class CircularQueue {
    int capacity;
    int[] buf;
    int front;
    int back;
    int size;

    CircularQueue(int capacity) {
        this.capacity = capacity;                       // @init
        this.buf = new int[capacity];                   // @init
        this.front = 0;                                 // @init
        this.back = capacity - 1;                       // @init
        this.size = 0;                                  // @init
    }

    boolean enqueue(int x) {
        if (size == capacity) {                         // @full
            return false;                               // @full
        }
        back = (back + 1) % capacity;                   // @enqueue
        buf[back] = x;                                  // @enqueue
        size++;                                         // @enqueue
        return true;                                    // @enqueue
    }

    Integer dequeue() {
        if (size == 0) {                                // @empty
            return null;                                // @empty
        }
        int x = buf[front];                             // @dequeue
        front = (front + 1) % capacity;                 // @dequeue
        size--;                                         // @dequeue
        return x;                                       // @dequeue
    }
}
