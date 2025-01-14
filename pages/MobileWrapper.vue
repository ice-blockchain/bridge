<!-- MobileWrapper.vue -->
<template>
    <div>
        <slot />
    </div>
</template>

<script>

export default {
    name: 'MobileWrapper',

    data() {
        return {
            isMobile: false,
        }
    },

    mounted() {
        // Check mobile on mount
        this.checkMobile()

        // Add resize listener
        window.addEventListener('resize', this.checkMobile)
    },

    beforeDestroy() {
        // Clean up listener
        window.removeEventListener('resize', this.checkMobile)
    },

    methods: {
        checkMobile() {
            this.isMobile = window.innerWidth <= 768
        },
    },
}
</script>
