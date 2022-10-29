<template>
    <n-input :placeholder="text" :type="type" v-model="model" @input="$emit('update:model',event.target.value)" autosize style="min-width: 50%" />
</template>
<script>
 import { NInput } from 'naive-ui'
 export default{
    components:{
        NInput
    },
    props:['model','type','text'],
    emits:['update:model']
 }
</script> 