<template>
<video-background src="video/msc_yt.mp4"
class="video-container"
overlay="linear-gradient(0deg, rgba(0, 0, 0, 0.88), rgba(251, 148, 158, 0.22), rgba(251, 148, 158, 0.42))"
>
</video-background>
</template>
<script>
 import VideoBackground from 'vue-responsive-video-background-player'
 
export default{
    components:{
        VideoBackground
    }
    }
</script>
<style>
.video-container{

}
</style>