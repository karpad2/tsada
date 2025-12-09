<template>
    <div class="loading-container">
        <div class="skeleton-wrapper">
            <!-- Header skeleton -->
            <div class="skeleton-header">
                <div class="skeleton-logo"></div>
                <div class="skeleton-nav">
                    <div class="skeleton-nav-item"></div>
                    <div class="skeleton-nav-item"></div>
                    <div class="skeleton-nav-item"></div>
                    <div class="skeleton-nav-item"></div>
                </div>
            </div>

            <!-- Content skeleton -->
            <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
                <div class="skeleton-grid">
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                </div>
            </div>

            <!-- Loading text -->
            <div class="loading-text">
                <h2 class="dark:text-white text-gray-700 text-xl">{{ $t("getting_ready") }}</h2>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// i18n is globally available via $t in template
</script>

<style>
/* Dark mode styles - unscoped to work with html.dark */
html.dark .loading-container {
    background: #1a1a1a !important;
}

html.dark .skeleton-logo {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%) !important;
    background-size: 200% 100% !important;
}

html.dark .skeleton-nav-item {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%) !important;
    background-size: 200% 100% !important;
}

html.dark .skeleton-title {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%) !important;
    background-size: 200% 100% !important;
}

html.dark .skeleton-text {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%) !important;
    background-size: 200% 100% !important;
}

html.dark .skeleton-card {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%) !important;
    background-size: 200% 100% !important;
}
</style>

<style scoped>
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f9fafb;
    padding: 20px;
}

.skeleton-wrapper {
    width: 100%;
    max-width: 1200px;
}

/* Header skeleton */
.skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    margin-bottom: 40px;
}

.skeleton-logo {
    width: 120px;
    height: 60px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
}

.skeleton-nav {
    display: flex;
    gap: 20px;
}

.skeleton-nav-item {
    width: 80px;
    height: 20px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
}

/* Content skeleton */
.skeleton-content {
    padding: 20px;
}

.skeleton-title {
    width: 60%;
    height: 40px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
    margin-bottom: 20px;
}

.skeleton-text {
    width: 100%;
    height: 20px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 12px;
}

.skeleton-text.short {
    width: 70%;
}

.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 40px;
}

.skeleton-card {
    height: 200px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
}

.loading-text {
    text-align: center;
    margin-top: 40px;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .skeleton-nav {
        display: none;
    }

    .skeleton-title {
        width: 80%;
        height: 30px;
    }

    .skeleton-grid {
        grid-template-columns: 1fr;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .skeleton-logo,
    .skeleton-nav-item,
    .skeleton-title,
    .skeleton-text,
    .skeleton-card {
        animation: none;
    }

    .loading-text {
        animation: none;
    }
}
</style>
