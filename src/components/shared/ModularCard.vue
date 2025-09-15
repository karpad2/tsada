<template>
    <v-card
        :class="cardClass"
        :color="color"
        :variant="variant"
        :elevation="elevation"
        :rounded="rounded"
        v-bind="$attrs"
    >
        <!-- Header Section -->
        <v-card-title
            v-if="title || $slots.title"
            :class="headerClass"
            class="d-flex align-center"
        >
            <v-icon
                v-if="icon"
                :icon="icon"
                :color="iconColor"
                class="mr-3"
                size="large"
            />

            <div class="flex-grow-1">
                <slot name="title">
                    <span class="text-h6">{{ title }}</span>
                </slot>

                <div v-if="subtitle || $slots.subtitle" class="text-subtitle-2 opacity-80 mt-1">
                    <slot name="subtitle">{{ subtitle }}</slot>
                </div>
            </div>

            <!-- Header Actions -->
            <div v-if="$slots['header-actions']" class="ml-auto">
                <slot name="header-actions" />
            </div>
        </v-card-title>

        <!-- Content Section -->
        <v-card-text
            v-if="$slots.default || content"
            :class="contentClass"
        >
            <slot>{{ content }}</slot>
        </v-card-text>

        <!-- Footer Section -->
        <v-card-actions
            v-if="$slots.actions"
            :class="footerClass"
        >
            <slot name="actions" />
        </v-card-actions>

        <!-- Loading Overlay -->
        <v-overlay
            v-if="loading"
            contained
            class="align-center justify-center"
        >
            <v-progress-circular
                :color="loadingColor"
                indeterminate
                :size="loadingSize"
            />
            <div v-if="loadingText" class="text-center mt-3">
                <p class="text-body-2">{{ loadingText }}</p>
            </div>
        </v-overlay>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
    name: 'ModularCard',
    inheritAttrs: false,
    props: {
        title: {
            type: String,
            default: ''
        },
        subtitle: {
            type: String,
            default: ''
        },
        content: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: ''
        },
        iconColor: {
            type: String,
            default: 'primary'
        },
        color: {
            type: String,
            default: ''
        },
        variant: {
            type: String,
            default: 'elevated',
            validator: (value: string) => ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'].includes(value)
        },
        elevation: {
            type: [Number, String],
            default: 2
        },
        rounded: {
            type: [Boolean, String],
            default: 'lg'
        },
        loading: {
            type: Boolean,
            default: false
        },
        loadingText: {
            type: String,
            default: ''
        },
        loadingColor: {
            type: String,
            default: 'primary'
        },
        loadingSize: {
            type: [Number, String],
            default: 40
        },
        headerClass: {
            type: String,
            default: ''
        },
        contentClass: {
            type: String,
            default: 'pa-4'
        },
        footerClass: {
            type: String,
            default: 'px-4 pb-4'
        },
        theme: {
            type: String,
            default: '',
            validator: (value: string) => ['', 'primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(value)
        }
    },
    setup(props) {
        const cardClass = computed(() => {
            let classes = ['modular-card'];

            if (props.theme) {
                classes.push(`theme-${props.theme}`);
            }

            if (props.loading) {
                classes.push('is-loading');
            }

            return classes.join(' ');
        });

        return {
            cardClass
        };
    }
});
</script>

<style scoped>
.modular-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px !important;
    overflow: hidden;
}

.modular-card:hover:not(.is-loading) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.modular-card.is-loading {
    opacity: 0.8;
    pointer-events: none;
}

/* Theme variants */
.modular-card.theme-primary .v-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-primary-darken-1)));
    color: rgb(var(--v-theme-on-primary));
}

.modular-card.theme-secondary .v-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-secondary)), rgb(var(--v-theme-secondary-darken-1)));
    color: rgb(var(--v-theme-on-secondary));
}

.modular-card.theme-success .v-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-success)), rgb(var(--v-theme-success-darken-1)));
    color: rgb(var(--v-theme-on-success));
}

.modular-card.theme-warning .v-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-warning)), rgb(var(--v-theme-warning-darken-1)));
    color: rgb(var(--v-theme-on-warning));
}

.modular-card.theme-error .v-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-error)), rgb(var(--v-theme-error-darken-1)));
    color: rgb(var(--v-theme-on-error));
}

.modular-card.theme-info .v-card-title {
    background: linear-gradient(135deg, rgb(var(--v-theme-info)), rgb(var(--v-theme-info-darken-1)));
    color: rgb(var(--v-theme-on-info));
}

/* Responsive design */
@media (max-width: 600px) {
    .modular-card .v-card-title {
        flex-direction: column;
        text-align: center;
        gap: 12px;
    }

    .modular-card .v-card-title .ml-auto {
        margin-left: 0 !important;
    }
}

/* Animation for content changes */
.v-card-text {
    transition: all 0.3s ease;
}

.v-overlay {
    backdrop-filter: blur(2px);
}
</style>