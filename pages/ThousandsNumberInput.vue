<template>
    <input
        ref="inputRef"
        type="text"
        :value="displayValue"
        @input="handleChange"
        @keypress="allowOnlyNumeric($event)"
        :readOnly="readOnly"
        :disabled="disabled"
        :class="['thousands-number-input', { visible }, className]"
        :style="{
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: visible ? 'auto' : 'none',
        }"
    />
</template>

<script>
export default {
    name: 'ThousandsNumberInput',
    props: {
        initialValue: {
            type: String,
            default: '0',
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        suffix: {
            type: String,
            default: '',
        },
        className: {
            type: String,
            default: '',
        },
        visible: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            value: this.formatWithCommas(this.initialValue),
        }
    },
    watch: {
        initialValue(newVal) {
            this.value = this.formatWithCommas(newVal)
        },
    },
    methods: {
        allowOnlyNumeric(event) {
            // Allow only digits 0-9
            const char = String.fromCharCode(event.which)
            if (!/[0-9]/.test(char)) {
                event.preventDefault()
            }
        },
        focusInput() {
            // Parent can call this via: this.$refs.myInputRef.focusInput()
            if (this.$refs.inputRef && !this.readOnly && !this.disabled) {
                this.$refs.inputRef.focus()
            }
        },
        formatWithCommas(num) {
            const str = num.toString()
            return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        },
        removeNonNumeric(str) {
            return str.replace(/[^0-9]/g, '')
        },
        handleChange(event) {
            const inputVal = event.target.value
            const numericVal = this.removeNonNumeric(inputVal)
            const formattedVal = this.formatWithCommas(numericVal)

            this.value = formattedVal
            this.$emit('change', formattedVal)
        },
    },
    computed: {
        displayValue() {
            // If readOnly and suffix is defined, append suffix if value is not empty
            if (this.readOnly && this.suffix && this.value.length > 0) {
                return `${this.value}${this.suffix}`
            }
            return this.value
        },
    },
}
</script>

<style scoped>
.thousands-number-input {
    display: none !important;
}

.thousands-number-input.visible {
    display: inline !important;
}
</style>
