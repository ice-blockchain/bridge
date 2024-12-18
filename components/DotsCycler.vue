<template>
    <span>{{ dotSequence[currentIndex] }}</span>
</template>

<script>
export default {
    name: 'DotsCycler',
    data() {
        return {
            dotSequence: ['.', '..', '...'],
            currentIndex: 0,
            intervalId: null
        }
    },
    created() {
        this.intervalId = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.dotSequence.length;
        }, 500); // adjust this to speed up or slow down the cycling
    },
    beforeDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}
</script>
