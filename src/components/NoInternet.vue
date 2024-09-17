<script  lang="ts">
import Dino from './Dino.vue';
export default{
    components:{
        Dino
    }
}
</script>

<template>
    <div class="">
    <Dino />
     <h2 class="text-title text-3xl text-black dark:text-white">{{ $t("no_internet") }}</h2>
    </div>
</template>