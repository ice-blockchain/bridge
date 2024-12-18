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
            const char = String.fromCharCode(event.which)
            // Allow digits and decimal point
            if (!/[0-9.]/.test(char)) {
                event.preventDefault()
                return
            }

            // If it's a decimal point, ensure no other decimal point is present
            const currentValue = event.target.value
            if (char === '.' && currentValue.includes('.')) {
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
            if (!num) return num
            // Handle fractional numbers
            const parts = num.split('.')
            const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

            if (parts.length > 1) {
                // If there's a fractional part, keep it as is
                return integerPart + '.' + parts[1]
            } else {
                return integerPart
            }
        },
        removeNonNumeric(str) {
            return str.replace(/[^0-9.]/g, '')
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
