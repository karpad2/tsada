<template>
    <BaseDocuments :show-category-management="true" collection-type="default" />
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

