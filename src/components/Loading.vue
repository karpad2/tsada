<template>
    <div class="loading">
        <img src="@a/tsada_logo.png" alt="Loading" class="loading-image">
    </div>
</template>

<style>
.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    transform: scale(0.5);
}

.loading-image {
    animation: pulse 2s linear infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.5);
        opacity: 1;
    }
    50% {
        transform: scale(0.7);
        opacity: 0.7;
        filter: blur(2px); 
    }
    100% {
        transform: scale(0.5);
        opacity: 1;
    }
}
</style>
