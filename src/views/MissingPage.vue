<template>

    <div class="w-1/2 h-full m-auto p-40" style="height: 100vh;">
        <h1>404 {{ $t("error") }}</h1>
        <VBtn @click="$router.go(-1)">{{ $t("goback") }}</VBtn>
    </div>
</template>
<script >
export default{
    mounted()
    {
        document.title="404 "+this.$t("error");
    }
}
   
</script>