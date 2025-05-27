<template>
    <div>
      <p v-if="admin" class="no_print">
        <VBtn @click="$emit('edit')">{{ $t("edit") }}</VBtn>
        <VBtn v-if="false" @click="downloadPDF">PDF</VBtn>
      </p>
  
      <div ref="pdfContent" class="w-full p-5 dark:text-white print_content" v-html="chtml"></div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { jsPDF } from "jspdf";
  import html2canvas from "html2canvas";
  
  const props = defineProps(['chtml', 'admin']);
  const pdfContent = ref(null);
  
  const downloadPDF = async () => {
    const canvas = await html2canvas(pdfContent.value, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 1;
  
    const addHeaderFooter = (pdf, pageNumber) => {
      pdf.setFontSize(12);
      pdf.text("Custom Header", 105, 10, { align: "center" });
      pdf.text(`Page ${pageNumber}`, 105, pageHeight - 10, { align: "center" });
    };
  
    addHeaderFooter(pdf, pageNumber);
    pdf.addImage(imgData, "PNG", 0, 20, imgWidth, imgHeight);
    heightLeft -= pageHeight - 30;
  
    while (heightLeft > 0) {
      pageNumber++;
      position = heightLeft - imgHeight;
      pdf.addPage();
      addHeaderFooter(pdf, pageNumber);
      pdf.addImage(imgData, "PNG", 0, position + 20, imgWidth, imgHeight);
      heightLeft -= pageHeight - 30;
    }
  
    pdf.save("content.pdf");
  };
  </script>
  