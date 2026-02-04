<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { 
  Bold, Italic, Strikethrough, Code, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, 
  CodeXml, Undo, Redo, Image as ImageIcon,
  Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-vue-next'
import TextAlign from '@tiptap/extension-text-align'
// jSquash imports are handled dynamically below

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>()

const emit = defineEmits(['update:modelValue'])

const { isUploading, uploadImage } = useImageUpload()
const fileInput = ref<HTMLInputElement | null>(null)

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; height: auto; transition: all 0.3s ease;`,
        }),
      },
      align: {
        default: 'left',
        renderHTML: attributes => {
          let style = '';
          if (attributes.align === 'center') {
            style = 'display: block; margin-left: auto; margin-right: auto; float: none;';
          } else if (attributes.align === 'right') {
            style = 'float: right; margin-left: 1.5rem; margin-bottom: 0.5rem; display: inline-block;';
          } else {
            // Default or left
            style = 'float: left; margin-right: 1.5rem; margin-bottom: 0.5rem; display: inline-block;';
          }
          return {
            style: `transition: all 0.3s ease; ${style}`,
            'data-align': attributes.align,
          }
        },
      },
    }
  },
})

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    CustomImage.configure({
      HTMLAttributes: {
        class: 'rounded-lg max-w-full',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-3 py-2',
    },
  },
})

// Sync modelValue -> editor
watch(() => props.modelValue, (value) => {
  const isSame = editor.value?.getHTML() === value
  if (isSame) return
  editor.value?.commands.setContent(value)
})

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !editor.value) return

  try {
    const response = await uploadImage(file)

    if (response?.success) {
      const url = `/images/${response.imageId}_1024w.webp`
      editor.value.chain().focus().setImage({ src: url }).run()
    }
  } catch (error) {
    console.error('Tiptap Image Upload Error:', error)
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function triggerImageUpload() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="w-full border rounded-md overflow-hidden bg-background">
    <!-- Hidden File Input -->
    <input 
      type="file" 
      ref="fileInput" 
      class="hidden" 
      accept="image/*" 
      @change="handleImageUpload"
    />

    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/50">
      <div class="flex items-center border-r pr-1 mr-1 gap-1">
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          <Heading1 class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          <Heading2 class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          <Heading3 class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center border-r pr-1 mr-1 gap-1">
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <Bold class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <Italic class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <Strikethrough class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center border-r pr-1 mr-1 gap-1">
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive({ textAlign: 'left' }) }"
          @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <AlignLeft class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive({ textAlign: 'center' }) }"
          @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <AlignCenter class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive({ textAlign: 'right' }) }"
          @click="editor.chain().focus().setTextAlign('right').run()"
        >
          <AlignRight class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive({ textAlign: 'justify' }) }"
          @click="editor.chain().focus().setTextAlign('justify').run()"
        >
          <AlignJustify class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center border-r pr-1 mr-1 gap-1">
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <List class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <ListOrdered class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center border-r pr-1 mr-1 gap-1">
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <Quote class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          :class="{ 'bg-accent': editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          <CodeXml class="h-4 w-4" />
        </Button>
      </div>

      <!-- Image Specific Toolbar (shown only when an image is selected) -->
      <div v-if="editor.isActive('image')" class="flex items-center gap-1 border-r pr-1 mr-1">
        <div class="flex items-center bg-accent/50 rounded-md p-0.5 gap-0.5">
          <Button 
            type="button" variant="ghost" size="sm" class="h-7 px-2 text-[10px] uppercase font-bold"
            @click="editor.chain().focus().updateAttributes('image', { width: '25%' }).run()"
          >
            25%
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" class="h-7 px-2 text-[10px] uppercase font-bold"
            @click="editor.chain().focus().updateAttributes('image', { width: '50%' }).run()"
          >
            50%
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" class="h-7 px-2 text-[10px] uppercase font-bold"
            @click="editor.chain().focus().updateAttributes('image', { width: '100%' }).run()"
          >
            100%
          </Button>
        </div>
        <Separator orientation="vertical" class="h-4 mx-1" />
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          @click="editor.chain().focus().updateAttributes('image', { align: 'left' }).run()"
        >
          <AlignLeft class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          @click="editor.chain().focus().updateAttributes('image', { align: 'center' }).run()"
        >
          <AlignCenter class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          @click="editor.chain().focus().updateAttributes('image', { align: 'right' }).run()"
        >
          <AlignRight class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center gap-1">
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          @click="triggerImageUpload"
          :disabled="isUploading"
        >
          <Loader2 v-if="isUploading" class="h-4 w-4 animate-spin" />
          <ImageIcon v-else class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8 ml-2"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
        >
          <Undo class="h-4 w-4" />
        </Button>
        <Button 
          type="button" variant="ghost" size="icon" class="h-8 w-8"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
        >
          <Redo class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Editor Surface -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
@reference "../../../assets/css/tailwind.css";

/* Tiptap specific styles */
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap img {
  @apply rounded-lg my-4 cursor-pointer outline-none;
}

.tiptap img.ProseMirror-selectednode {
  @apply ring-2 ring-primary ring-offset-2;
}

.tiptap blockquote {
  @apply border-l-4 border-primary pl-4 py-2 italic;
}

.tiptap pre {
  @apply bg-muted p-4 rounded-lg my-4 font-mono text-sm;
}
</style>
