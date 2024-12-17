<template>
    <div class="LayoutDefault">
        <Nuxt />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { primaryInput } from 'detect-it'

export default Vue.extend({
    name: 'LayoutDefault',

    head(): object {
        return {
            htmlAttrs: {
                lang: 'en',
                translate: 'no',
            },
            meta: [
                {
                    hid: 'description',
                    name: 'description',
                    content:
                        'Seamlessly transfer ICE between ION and BSC networks with the ION Bridge. Enjoy a secure, user-friendly token swap experience and easily manage your wallet.',
                },
                {
                    hid: 'google',
                    name: 'google',
                    content: 'notranslate',
                },
            ],
            link: [
                {
                    // Include the `Noto Sans` font
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap',
                },
            ],
        }
    },

    mounted() {
        // for active/hovers on touch/mouse devices
        document.documentElement.classList.add(
            primaryInput === 'touch' ? 'isTouch' : 'isPointer'
        )
    },
})
</script>

<style lang="less">
* {
    box-sizing: border-box;
}

body {
    font-family: 'Noto Sans', sans-serif;
    -webkit-text-size-adjust: 100%;
}

a,
a:hover,
a:after,
a:active,
a:focus {
    color: #1d98dc;
    text-decoration: none;
    word-break: break-all;
}
</style>
