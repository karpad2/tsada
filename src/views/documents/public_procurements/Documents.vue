<template>
    <BaseDocuments :show-category-management="false" collection-type="public_procurements" />
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

