<template>
    <div>
    <n-config-provider :theme="theme">
    <n-card>
      <n-space>
        <n-button @click="theme = darkTheme">
          Dark
        </n-button>
        <n-button @click="theme = null">
          Light
        </n-button>
      </n-space>
    </n-card>
  </n-config-provider>
    
    </div>
</template>
<script>
export default{
    data(){
       return {
        theme:null
       }
    }
}
</script>