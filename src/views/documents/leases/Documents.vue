<template>
    <BaseDocuments :show-category-management="false" collection-type="leases" />
</template>

<script lang="ts">
import BaseDocuments from '@/components/BaseDocuments.vue';

export default {
    name: 'Documents',
    components: {
        BaseDocuments
    }
}
</script>

