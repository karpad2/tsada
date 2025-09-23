<template>
    <BaseStudentDocuments :show-category-management="true" collection-type="default" />
</template>
  
<script lang="ts">
import BaseStudentDocuments from '@/components/BaseStudentDocuments.vue';

export default {
    name: 'StudentDocuments',
    components: {
        BaseStudentDocuments
    }
}
</script>
  
