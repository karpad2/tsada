<template>
    <div class="relative pb-5 container px-5 mx-auto bg-white">
      <SwitchPanel
        v-model:visible="flags.visible"
        v-model:notNews="flags.notNews"
        v-model:showDate="flags.show_date"
        @save="save"
        @delete="delete_content"
        @share="share_fb"
      />
  
      <v-file-input
        @change="file_upload"
        v-model="file_link"
        accept="image/*"
        :label="$t('fileupload')"
      />
  
      <div v-if="img">
        <PreviewImage :img="img" />
      </div>
  
      <LanguageEditor
        lang="rs"
        v-model:title="title.rs"
        v-model:content="content.rs"
        @save="save"
      />
      <v-btn @click="new_stuff()" class="m-5">
          {{ $t('add_new_document_in_that_category') }}
      </v-btn>

  
      <LanguageEditor
        lang="hu"
        v-model:title="title.hu"
        v-model:content="content.hu"
        @save="save"
      />
      <v-btn @click="new_stuff()" class="m-5">
          {{ $t('add_new_document_in_that_category') }}
      </v-btn>

      
  
      <LanguageEditor
        lang="en"
        v-model:title="title.en"
        v-model:content="content.en"
        @save="save"
      />
      
      <v-btn @click="new_stuff()" class="m-5">
          {{ $t('add_new_document_in_that_category') }}
      </v-btn>
  
      <YoutubeInput
        :videos="yt_videos"
        @update:videos="yt_videos = $event"
        @save="save"
      />
  
      <DocumentSection
        :id="id"
        :documents_flag="flags.documents"
        :documents="documents"
        :headers="headers"
        :new_stuff="new_stuff"
        :documents_load="documents_load"
      />
  
      <GallerySection
        v-model:album_flag="flags.album"
        v-model:gallery_id="gallery_id"
        :galleries="galleries"
        :save="save"
        :gallery_change="gallery_change"
        :g_save="g_save"
        :_update="_update"
      />
    </div>
  </template>
  
  <script lang="ts">
  import { Client, Databases, ID, Storage, Query, Functions } from "appwrite";
  import { appw, config } from "@/appwrite";
  import axios from "axios";
  import LanguageEditor from "@/components/LanguageEditor.vue";
  import YoutubeInput from "./ContentEditorComponents/YoutubeInput.vue";
  import PreviewImage from "./ContentEditorComponents/PreviewImage.vue";
  import GallerySection from "./ContentEditorComponents/GallerySection.vue";
  import DocumentSection from "./ContentEditorComponents/DocumentSection.vue";
  import { useLoadingStore } from "@/stores/loading";
  import AlbumViewer from "@/components/AlbumViewer.vue";
  import SwitchPanel from "./ContentEditorComponents/SwitchPanel.vue";
  import { convertifserbian } from "@/lang";
  import DocLister from "@/components/DocLister.vue";
  
  export default {
    components: {
      AlbumViewer,
      DocLister,
      LanguageEditor,
      SwitchPanel,
      YoutubeInput,
      PreviewImage,
      GallerySection,
      DocumentSection
    },
    data() {
      return {
        id: "",
        title: { rs: "", hu: "", en: "" },
        content: { rs: "", hu: "", en: "" },
        flags: {
          visible: false,
          notNews: true,
          show_date: false,
          documents: false,
          album: false
        },
        yt_video: "", // legacy
        yt_videos: [], // array support
        gallery_id: "",
        galleries: [],
        file_link: null,
        default_image: "",
        img: "",
        fb_message: "",
        fb_public: false,
        uploading: false,
        documents: [],
        doc_loaded: false,
        headers: [],
        colDefs: [],
        chtmls:[],
        _update: true
      };
    },
    mounted() {
      this.id = this.$route.params.id;
      this.getMD();
      this.headers = [
        { title: this.$t("name"), align: 'start', sortable: false, key: 'name', width: '200px' },
        { title: this.$t("date"), align: 'start', key: 'date', width: '300px' },
        { title: this.$t("open_document"), align: 'start', key: 'open', width: '300px' },
        { title: this.$t("edit_document"), align: 'start', key: 'edit', width: '300px' }
      ];
      this.load_galleries();
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    },
    beforeUnmount() {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    },
    methods: {
      async g_save() {
        this._update = false;
        await this.save();
        this._update = true;
      },
      async getMD() {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const k = await database.getDocument(config.website_db, config.about_us_db, this.id);
        this.title = { rs: k.title_rs, hu: k.title_hu, en: k.title_en };
        this.content = { rs: k.text_rs, hu: k.text_hu, en: k.text_en };
        this.yt_video = k.yt_video;
        let nyaa=await database.listDocuments(config.website_db,config.text_components,[Query.equal("doc_id",this.$route.params.id),Query.equal("lang",cc.language),Query.orderAsc("order")]);
        this.chtmls=nyaa.documents;

        this.yt_videos = Array.isArray(k.yt_video) ? k.yt_video : (k.yt_video ? [k.yt_video] : []);
        this.flags.visible = k.visible;
        this.flags.notNews = k.notNews;
        this.flags.show_date = k.show_date;
        this.flags.documents = k.has_documents;
        this.flags.album = k.has_gallery;
        this.gallery_id = k.gallery?.$id || "";
        this.img = k.default_image
          ? storage.getFileView(config.website_images, k.default_image).toString()
          : "https://dummyimage.com/720x400";
        this.synchronize_documents();
      },
      handleBeforeUnload(event) {
        if (this.uploading) {
          event.preventDefault();
          this.$notify({ type: 'error', text: this.$t('file_still_uploading') });
          event.returnValue = '';
        }
      },
      async save() {
        const database = new Databases(appw);
        await database.updateDocument(config.website_db, config.about_us_db, this.id, {
          title_rs: this.title.rs,
          title_hu: this.title.hu,
          title_en: this.title.en,
          text_rs: this.content.rs,
          text_hu: this.content.hu,
          text_en: this.content.en,
          visible: this.flags.visible,
          notNews: this.flags.notNews,
          show_date: this.flags.show_date,
          has_documents: this.flags.documents,
          has_gallery: this.flags.album,
          gallery: this.gallery_id,
          yt_video: this.yt_videos,
          default_image: this.default_image
        });
        this.$notify(this.$t('saved'));
      },
      async share_fb() {
        const database = new Databases(appw);
        const kk = await database.getDocument(config.website_db, config.users_settings, "fb_access_token");
        const x = `https://share.tsada.edu.rs/${this.id}`;
        await axios.post(`https://graph.facebook.com/v20.0/${config.pan}/feed`, {
          message: null,
          link: x,
          access_token: kk.parameter,
          published: true
        });
      },
      async documents_load() {
        await this.save();
        this.synchronize_documents();
      },
      async gallery_change() {
        if (!this.gallery_id) {
          this.gallery_id = await this.new_gallery();
        }
        await this.save();
      },
      async load_galleries() {
        const database = new Databases(appw);
        const l = await database.listDocuments(config.website_db, config.gallery, [
          Query.select(["title_hu", "title_en", "title_rs", "short_en", "short_hu", "short_rs", "$id", "default_image", "visible"]),
          Query.limit(25)
        ]);
        const local = useLoadingStore().language;
        this.galleries = l.documents.map(el => ({
          id: el.$id,
          visible: el.visible,
          title: local === 'en' ? el.title_en : local === 'hu' ? el.title_hu : convertifserbian(el.title_rs),
          subtitle: local === 'en' ? el.short_en : local === 'hu' ? el.short_hu : convertifserbian(el.short_rs),
          en: el.code || el.title_en
        }));
      },
      async new_gallery() {
        const database = new Databases(appw);
        const l = await database.createDocument(config.website_db, config.gallery, ID.unique(), {
          visible: false,
          title_rs: this.title.rs,
          title_hu: this.title.hu,
          title_en: this.title.en
        });
        return l.$id;
      },
      async new_stuff() {
        const database = new Databases(appw);
        const l = await database.createDocument(config.website_db, config.text_documents, ID.unique(), {
          texts: this.id
        });
        this.$router.push("/admin/text-document-editor/" + l.$id);
      },
      async new_part()
      {
        const database = new Databases(appw);
        const l = await database.createDocument(config.website_db, config.text_documents, ID.unique(), {
          texts: this.id
        });
      },
      async synchronize_documents() {
        const database = new Databases(appw);
        if (!this.flags.documents) return;
        this.doc_loaded = false;
        this.documents = [];
        const local = useLoadingStore().language;
        const docs = await database.listDocuments(config.website_db, config.text_documents, [
          Query.equal("texts", [this.id])
        ]);
        for (const el2 of docs.documents) {
          this.documents.push({
            id: el2.$id,
            doc_id: el2.document_id,
            name: local === 'rs' ? convertifserbian(el2.document_title_rs) : el2.document_title_hu,
            contact: el2.contact,
            date: el2.$createdAt
          });
        }
        this.doc_loaded = true;
      },
      async delete_content() {
        const database = new Databases(appw);
        await database.deleteDocument(config.website_db, config.about_us_db, this.id);
        this.$notify(this.$t('deleted'));
        this.$router.push("/home");
      },
      async file_upload() {
        if (!this.file_link) return;
        this.uploading = true;
        const storage = new Storage(appw);
        const result = await storage.createFile(config.website_images, ID.unique(), this.file_link);
        this.default_image = result.$id;
        await this.save();
        this.$notify(this.$t('file_uploaded'));
        this.uploading = false;
      }
    }
  };
  </script>
  