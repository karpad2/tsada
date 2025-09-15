<template>
    <div class="status-indicator d-inline-flex align-center">
        <!-- Icon or Dot Indicator -->
        <div class="indicator-visual mr-2">
            <v-avatar
                v-if="showAvatar"
                :size="avatarSize"
                :color="statusColor"
                class="status-avatar"
            >
                <v-icon
                    :icon="statusIcon"
                    :color="iconColor"
                    :size="iconSize"
                />
            </v-avatar>

            <div
                v-else
                class="status-dot"
                :class="`status-dot--${status}`"
                :style="{ backgroundColor: statusColor }"
            />
        </div>

        <!-- Status Text -->
        <div class="status-content flex-grow-1">
            <span
                class="status-text"
                :class="textClass"
            >
                {{ displayText }}
            </span>

            <div
                v-if="subtitle"
                class="status-subtitle text-body-2 opacity-70 mt-1"
            >
                {{ subtitle }}
            </div>
        </div>

        <!-- Additional Actions -->
        <div v-if="$slots.actions" class="status-actions ml-2">
            <slot name="actions" />
        </div>

        <!-- Pulse Animation for Active States -->
        <div
            v-if="animated && (status === 'active' || status === 'processing')"
            class="pulse-ring"
            :style="{ borderColor: statusColor }"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'StatusIndicator',
    props: {
        status: {
            type: String,
            required: true,
            validator: (value: string) => [
                'active', 'inactive', 'pending', 'success', 'error',
                'warning', 'processing', 'completed', 'cancelled'
            ].includes(value)
        },
        text: {
            type: String,
            default: ''
        },
        subtitle: {
            type: String,
            default: ''
        },
        showAvatar: {
            type: Boolean,
            default: false
        },
        avatarSize: {
            type: [Number, String],
            default: 24
        },
        iconSize: {
            type: [Number, String],
            default: 16
        },
        animated: {
            type: Boolean,
            default: true
        },
        customColor: {
            type: String,
            default: ''
        },
        customIcon: {
            type: String,
            default: ''
        }
    },
    setup(props) {
        const { t } = useI18n();

        const statusConfig = computed(() => {
            const configs = {
                active: {
                    color: 'success',
                    icon: 'mdi-check-circle',
                    text: 'active',
                    class: 'text-success font-weight-medium'
                },
                inactive: {
                    color: 'grey',
                    icon: 'mdi-circle-outline',
                    text: 'inactive',
                    class: 'text-grey'
                },
                pending: {
                    color: 'warning',
                    icon: 'mdi-clock-outline',
                    text: 'pending',
                    class: 'text-warning font-weight-medium'
                },
                success: {
                    color: 'success',
                    icon: 'mdi-check-circle',
                    text: 'success',
                    class: 'text-success font-weight-medium'
                },
                error: {
                    color: 'error',
                    icon: 'mdi-alert-circle',
                    text: 'error',
                    class: 'text-error font-weight-medium'
                },
                warning: {
                    color: 'warning',
                    icon: 'mdi-alert',
                    text: 'warning',
                    class: 'text-warning font-weight-medium'
                },
                processing: {
                    color: 'info',
                    icon: 'mdi-loading',
                    text: 'processing',
                    class: 'text-info font-weight-medium'
                },
                completed: {
                    color: 'success',
                    icon: 'mdi-check-all',
                    text: 'completed',
                    class: 'text-success font-weight-medium'
                },
                cancelled: {
                    color: 'error',
                    icon: 'mdi-cancel',
                    text: 'cancelled',
                    class: 'text-error'
                }
            };

            return configs[props.status as keyof typeof configs] || configs.inactive;
        });

        const statusColor = computed(() => {
            if (props.customColor) return props.customColor;
            return `rgb(var(--v-theme-${statusConfig.value.color}))`;
        });

        const statusIcon = computed(() => {
            if (props.customIcon) return props.customIcon;
            return statusConfig.value.icon;
        });

        const iconColor = computed(() => {
            return props.showAvatar ? 'white' : statusConfig.value.color;
        });

        const displayText = computed(() => {
            if (props.text) return props.text;
            return t(statusConfig.value.text);
        });

        const textClass = computed(() => {
            return statusConfig.value.class;
        });

        return {
            statusColor,
            statusIcon,
            iconColor,
            displayText,
            textClass
        };
    }
});
</script>

<style scoped>
.status-indicator {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
}

.status-avatar {
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.status-text {
    font-size: 0.875rem;
    line-height: 1.25;
}

/* Pulse animation */
.pulse-ring {
    content: '';
    position: absolute;
    left: -2px;
    top: -2px;
    width: calc(100% + 4px);
    height: calc(100% + 4px);
    border: 2px solid;
    border-radius: 50%;
    animation: pulse 2s infinite;
    pointer-events: none;
}

@keyframes pulse {
    0% {
        transform: scale(0.8);
        opacity: 1;
    }
    70% {
        transform: scale(1.2);
        opacity: 0;
    }
    100% {
        transform: scale(1.2);
        opacity: 0;
    }
}

/* Status-specific dot styles */
.status-dot--active {
    box-shadow: 0 0 6px rgba(var(--v-theme-success), 0.6);
}

.status-dot--error {
    box-shadow: 0 0 6px rgba(var(--v-theme-error), 0.6);
}

.status-dot--warning {
    box-shadow: 0 0 6px rgba(var(--v-theme-warning), 0.6);
}

.status-dot--processing {
    animation: processing 1.5s infinite;
}

@keyframes processing {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

/* Responsive design */
@media (max-width: 600px) {
    .status-indicator {
        flex-direction: column;
        text-align: center;
        gap: 4px;
    }

    .status-actions {
        margin-left: 0 !important;
        margin-top: 8px;
    }
}
</style>