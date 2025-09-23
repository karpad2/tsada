<template>
    <BaseStudentDocuments :show-category-management="false" collection-type="leases" />
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
