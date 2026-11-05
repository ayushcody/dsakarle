// nums is a fixed-size array: `capacity` slots, of which the first `size` are in use.
int insert(int nums[], int capacity, int size, int i, int value) {
    if (size == capacity) {                // @room
        return -1;                         // @room
    }
    for (int j = size; j > i; j--) {
        nums[j] = nums[j - 1];             // @shift
    }
    nums[i] = value;                       // @write
    return size + 1;                       // @done
}
