<template>
    <div class="loading1 text-black dark:text-white ">
        <div>
        <img v-if="false" src="@a/tsada_logo.png" alt="Loading" class=" spin">
        </div>
        <div>
            <span  class=" w-28 h-28 loading loading-ring "></span>
            <h2 class=" text-2xl">{{ $t("getting_ready") }}</h2>
        </div>
    </div>
</template>

<style>
.loading1 {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    transform: scale(0.5);
}

.loading1-image {
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
