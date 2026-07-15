<script  lang="ts">
import Dino from './Dino.vue';
export default{
    components:{
        Dino
    }
}
</script>

<template>
    <div class="page-shell flex flex-col items-center justify-center py-12">
    <Dino />
     <h2 class="section-title !text-3xl text-center">{{ $t("no_internet") }}</h2>
     <div class="section-accent !w-20 !mb-0"></div>
    </div>
</template>