<template>
  <span ref="root" class="progressive-image" :class="wrapClass">
    <img
      v-if="tinySrc"
      :src="tinySrc"
      alt=""
      class="progressive-image__lqip"
      :class="{ 'is-gone': sharpReady }"
      draggable="false"
      @load="onTinyLoad"
      @error="onTinyError"
    />
    <img
      v-if="sharpSrc"
      :src="sharpSrc"
      :alt="alt"
      class="progressive-image__sharp"
      :class="[imgClass, { 'is-ready': sharpReady }]"
      draggable="false"
      @load="onSharpLoad"
      @error="onSharpError"
    />
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { galleryLayerUrl, type GalleryLayer } from '@/services/gallery/imageUrl'
import { prefetchImage } from '@/services/gallery/loadQueue'

export default defineComponent({
  name: 'ProgressiveImage',
  props: {
    imageId: { type: String, default: '' },
    alt: { type: String, default: '' },
    layer: { type: String as () => Exclude<GalleryLayer, 'tiny' | 'full'>, default: 'thumb' },
    eager: { type: Boolean, default: false },
    imgClass: { type: String, default: '' },
    wrapClass: { type: String, default: '' }
  },
  emits: ['ready', 'error'],
  data: () => ({
    tinySrc: '',
    sharpSrc: '',
    sharpReady: false,
    tinyReady: false,
    observer: null as IntersectionObserver | null,
    visible: false,
    failed: false
  }),
  watch: {
    imageId: {
      immediate: true,
      handler() {
        this.resetLayers()
      }
    }
  },
  mounted() {
    if (this.eager) {
      this.visible = true
      this.requestSharp()
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      this.visible = true
      this.requestSharp()
      return
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible = true
          this.requestSharp()
          this.observer?.disconnect()
        }
      },
      { rootMargin: '180px' }
    )
    this.observer.observe(this.$el as Element)
  },
  beforeUnmount() {
    this.observer?.disconnect()
  },
  methods: {
    resetLayers() {
      this.sharpReady = false
      this.tinyReady = false
      this.failed = false
      this.sharpSrc = ''
      this.tinySrc = this.imageId ? galleryLayerUrl(this.imageId, 'tiny') : ''
      if (this.visible || this.eager) this.requestSharp()
    },
    requestSharp() {
      if (!this.imageId || this.sharpSrc) return
      const id = this.imageId
      const url = galleryLayerUrl(id, this.layer)
      if (!url) return
      void prefetchImage(url).then((ok) => {
        if (!ok || this.imageId !== id) return
        this.sharpSrc = url
      })
    },
    onTinyLoad() {
      this.tinyReady = true
      this.$emit('ready')
      if (this.visible || this.eager) this.requestSharp()
    },
    onTinyError() {
      if (!this.sharpSrc) this.requestSharp()
    },
    onSharpLoad() {
      this.sharpReady = true
      this.failed = false
      this.$emit('ready')
    },
    onSharpError() {
      this.sharpSrc = ''
      if (!this.tinyReady) {
        this.failed = true
        this.$emit('error')
      }
    }
  }
})
</script>

<style scoped>
.progressive-image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.18);
}

.progressive-image__lqip,
.progressive-image__sharp {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.progressive-image__lqip {
  filter: blur(14px);
  transform: scale(1.08);
  transition: opacity 0.35s ease;
}

.progressive-image__lqip.is-gone {
  opacity: 0;
}

.progressive-image__sharp {
  opacity: 0;
  transition: opacity 0.35s ease;
}

.progressive-image__sharp.is-ready {
  opacity: 1;
}
</style>
