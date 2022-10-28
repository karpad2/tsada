<template>
<n-space vertical>
    <n-input placeholder="Autosizable" autosize style="min-width: 50%" />
   
    
  </n-space>
</template>
<script>
 import { NInput,NSpace } from 'naive-ui'
 export default{
    components:{
        NInput,NSpace
    },
    props:{
        name,
        text:""
    }
 }
</script> 