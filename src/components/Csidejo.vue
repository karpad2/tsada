<template>
<video-background :src="video"
class="video-container"
overlay="linear-gradient(0deg, rgba(0, 0, 0, 0.88), rgba(251, 148, 158, 0.22), rgba(251, 148, 158, 0.42))"
>

</video-background>
</template>
<script>
 import VideoBackground from 'vue-responsive-video-background-player'
 import video from "@/assets/Video/msc_yt.webm"
export default{
    components:{
        'video-background':VideoBackground
    }
    }
</script>
<style>
.video-container{

}
</style>