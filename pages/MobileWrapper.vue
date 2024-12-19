<!-- MobileWrapper.vue -->
<template>
    <div>
        <NoMobile v-if="isMobile" />
        <slot v-else></slot>
    </div>
</template>

<script>
import NoMobile from './NoMobile.vue'

export default {
    name: 'MobileWrapper',
    components: {
        NoMobile,
    },

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
