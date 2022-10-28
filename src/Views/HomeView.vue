<template>
    <p>hello worldo</p>
    <n-button>naive-ui</n-button>
    <Csidejo />
    <News/>
    <Statistics/>
    <Departments/>

</template>
<script>
import Statistics from '@/components/Statistics.vue';
import News from '@/components/News.vue';
import Departments from '@/components/Departments.vue';
import Csidejo from '@/components/Csidejo.vue';
export default {
components:{
    Statistics,
    News,
    Departments,
    Csidejo
}
}
</script>