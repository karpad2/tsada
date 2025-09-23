<template>
    <BaseStudentDocuments :show-category-management="false" collection-type="public_procurements" />
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
