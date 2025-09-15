<template>
    <v-btn
        :class="buttonClass"
        :color="color"
        :variant="variant"
        :size="size"
        :disabled="disabled || loading"
        :loading="loading"
        :icon="isIconOnly"
        :block="block"
        :rounded="rounded"
        v-bind="$attrs"
        @click="handleClick"
    >
        <!-- Icon (Left) -->
        <template v-if="prependIcon && !isIconOnly" #prepend>
            <v-icon :icon="prependIcon" />
        </template>

        <!-- Main Icon (for icon-only buttons) -->
        <template v-if="isIconOnly">
            <v-icon :icon="icon" />
        </template>

        <!-- Button Text -->
        <template v-if="!isIconOnly">
            <slot>{{ text }}</slot>
        </template>

        <!-- Icon (Right) -->
        <template v-if="appendIcon && !isIconOnly" #append>
            <v-icon :icon="appendIcon" />
        </template>
    </v-btn>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
    name: 'ActionButton',
    inheritAttrs: false,
    emits: ['click'],
    props: {
        text: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: ''
        },
        prependIcon: {
            type: String,
            default: ''
        },
        appendIcon: {
            type: String,
            default: ''
        },
        color: {
            type: String,
            default: 'primary'
        },
        variant: {
            type: String,
            default: 'elevated',
            validator: (value: string) => [
                'elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'
            ].includes(value)
        },
        size: {
            type: String,
            default: 'default',
            validator: (value: string) => [
                'x-small', 'small', 'default', 'large', 'x-large'
            ].includes(value)
        },
        disabled: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        },
        block: {
            type: Boolean,
            default: false
        },
        rounded: {
            type: [Boolean, String],
            default: true
        },
        actionType: {
            type: String,
            default: 'default',
            validator: (value: string) => [
                'default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'
            ].includes(value)
        },
        confirmAction: {
            type: Boolean,
            default: false
        },
        confirmMessage: {
            type: String,
            default: 'Are you sure you want to perform this action?'
        },
        tooltip: {
            type: String,
            default: ''
        }
    },
    setup(props, { emit }) {
        const isIconOnly = computed(() => {
            return !!props.icon && !props.text && !props.prependIcon && !props.appendIcon;
        });

        const buttonClass = computed(() => {
            let classes = ['action-button'];

            // Add action type class
            if (props.actionType !== 'default') {
                classes.push(`action-button--${props.actionType}`);
            }

            // Add loading state class
            if (props.loading) {
                classes.push('action-button--loading');
            }

            // Add disabled state class
            if (props.disabled) {
                classes.push('action-button--disabled');
            }

            return classes.join(' ');
        });

        const handleClick = (event: Event) => {
            if (props.disabled || props.loading) {
                return;
            }

            if (props.confirmAction) {
                if (confirm(props.confirmMessage)) {
                    emit('click', event);
                }
            } else {
                emit('click', event);
            }
        };

        return {
            isIconOnly,
            buttonClass,
            handleClick
        };
    }
});
</script>

<style scoped>
.action-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    letter-spacing: 0.0892857143em;
    text-transform: none;
}

.action-button:not(.action-button--disabled):not(.action-button--loading):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-button--loading {
    pointer-events: none;
}

.action-button--disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Action type specific styles */
.action-button--primary {
    position: relative;
    overflow: hidden;
}

.action-button--primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.action-button--primary:hover::before {
    left: 100%;
}

.action-button--success {
    background: linear-gradient(45deg, rgb(var(--v-theme-success)), rgb(var(--v-theme-success-darken-1))) !important;
}

.action-button--warning {
    background: linear-gradient(45deg, rgb(var(--v-theme-warning)), rgb(var(--v-theme-warning-darken-1))) !important;
}

.action-button--error {
    background: linear-gradient(45deg, rgb(var(--v-theme-error)), rgb(var(--v-theme-error-darken-1))) !important;
}

.action-button--info {
    background: linear-gradient(45deg, rgb(var(--v-theme-info)), rgb(var(--v-theme-info-darken-1))) !important;
}

/* Size variations */
.v-btn--size-x-small {
    min-height: 24px;
    padding: 0 8px;
    font-size: 0.625rem;
}

.v-btn--size-small {
    min-height: 32px;
    padding: 0 12px;
    font-size: 0.75rem;
}

.v-btn--size-large {
    min-height: 48px;
    padding: 0 24px;
    font-size: 1rem;
    font-weight: 600;
}

.v-btn--size-x-large {
    min-height: 56px;
    padding: 0 32px;
    font-size: 1.125rem;
    font-weight: 600;
}

/* Icon button styles */
.v-btn--icon {
    border-radius: 50% !important;
}

.v-btn--icon:hover {
    transform: scale(1.1);
}

/* Block button styles */
.v-btn--block {
    width: 100%;
    max-width: none;
}

/* Responsive design */
@media (max-width: 600px) {
    .action-button {
        min-height: 44px; /* Larger touch target on mobile */
    }

    .v-btn--size-small {
        min-height: 40px;
    }

    .v-btn--size-large {
        min-height: 52px;
    }
}

/* Animation for loading state */
@keyframes button-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
    }
}

.action-button--loading {
    animation: button-pulse 2s infinite;
}

/* Focus styles for accessibility */
.action-button:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
}

/* Dark theme adjustments */
.v-theme--dark .action-button {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .action-button:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
</style>