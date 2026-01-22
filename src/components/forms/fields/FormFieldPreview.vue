<template>
  <div class="form-field-preview">
    <!-- Text Input -->
    <input
      v-if="field.type === 'text'"
      type="text"
      :placeholder="field.placeholder || 'Rövid szöveg...'"
      class="preview-input"
      disabled
    />

    <!-- Textarea -->
    <textarea
      v-else-if="field.type === 'textarea'"
      :placeholder="field.placeholder || 'Hosszú szöveg...'"
      rows="3"
      class="preview-textarea"
      disabled
    ></textarea>

    <!-- Email -->
    <input
      v-else-if="field.type === 'email'"
      type="email"
      :placeholder="field.placeholder || 'pelda@email.com'"
      class="preview-input"
      disabled
    />

    <!-- Number -->
    <input
      v-else-if="field.type === 'number'"
      type="number"
      :placeholder="field.placeholder || '0'"
      class="preview-input"
      disabled
    />

    <!-- Phone -->
    <input
      v-else-if="field.type === 'tel'"
      type="tel"
      :placeholder="field.placeholder || '+36 XX XXX XXXX'"
      class="preview-input"
      disabled
    />

    <!-- Date -->
    <input
      v-else-if="field.type === 'date'"
      type="date"
      class="preview-input"
      disabled
    />

    <!-- Time -->
    <input
      v-else-if="field.type === 'time'"
      type="time"
      class="preview-input"
      disabled
    />

    <!-- Select (Dropdown) -->
    <select
      v-else-if="field.type === 'select'"
      class="preview-select"
      disabled
    >
      <option value="" disabled selected>Válassz egy opciót...</option>
      <option v-for="(option, idx) in field.options" :key="idx" :value="option">
        {{ option }}
      </option>
    </select>

    <!-- Radio Buttons -->
    <div v-else-if="field.type === 'radio'" class="preview-radio-group">
      <label
        v-for="(option, idx) in field.options"
        :key="idx"
        class="preview-radio-option"
      >
        <input type="radio" :name="field.id" disabled />
        <span class="radio-circle"></span>
        <span class="radio-label">{{ option }}</span>
      </label>
    </div>

    <!-- Checkboxes -->
    <div v-else-if="field.type === 'checkbox'" class="preview-checkbox-group">
      <label
        v-for="(option, idx) in field.options"
        :key="idx"
        class="preview-checkbox-option"
      >
        <input type="checkbox" disabled />
        <span class="checkbox-box"></span>
        <span class="checkbox-label">{{ option }}</span>
      </label>
    </div>

    <!-- File Upload -->
    <div v-else-if="field.type === 'file'" class="preview-file-upload">
      <div class="file-upload-area">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span class="upload-text">Fájl feltöltése</span>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else class="preview-unknown">
      <span>Ismeretlen mező típus: {{ field.type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormField } from '@/services/forms/FormsService';

defineProps<{
  field: FormField;
  disabled?: boolean;
}>();
</script>

<style scoped>
.form-field-preview {
  pointer-events: none;
  opacity: 0.9;
}

.preview-input,
.preview-textarea,
.preview-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
}

.preview-input::placeholder,
.preview-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.preview-textarea {
  resize: none;
  min-height: 80px;
}

.preview-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;
}

.preview-radio-group,
.preview-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-radio-option,
.preview-checkbox-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: default;
}

.preview-radio-option input,
.preview-checkbox-option input {
  display: none;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  flex-shrink: 0;
}

.checkbox-box {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  flex-shrink: 0;
}

.radio-label,
.checkbox-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.preview-file-upload {
  width: 100%;
}

.file-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.upload-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.preview-unknown {
  padding: 12px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  color: rgba(255, 150, 150, 0.8);
  font-size: 0.9rem;
}
</style>
