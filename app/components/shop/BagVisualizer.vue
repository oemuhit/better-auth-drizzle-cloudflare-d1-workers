<script setup lang="ts">
import { ref, computed } from "vue";
import { useElementSize } from "@vueuse/core";
import { RotateCw, Info } from "lucide-vue-next";
import sucoImg from "~/assets/suco.png";
import intaxImg from "~/assets/intax.png";

interface Item {
  id: string;
  name: string;
  image: string;
  width: number; // visual width in cm
  height: number; // visual height in cm
  displayWidth?: number; // label width in cm
  displayHeight?: number; // label height in cm
  x: number;
  y: number;
  rotation: number;
}

const bagImage = "https://cdn.kaft.com/mnresize/1700/1700/static/images/bag/1721_1.jpg?cacheID=1762588612000";
const bagRealHeight = 25; // cm (approximate for a backpack)

const containerRef = ref<HTMLDivElement | null>(null);
const { width: containerWidth, height: containerHeight } = useElementSize(containerRef);

// Initialize with items already on the canvas
const activeItems = ref<Item[]>([
  {
    id: "bottle",
    name: "Su Şişesi (SuCo)",
    image: sucoImg,
    width: 10,
    height: 10,
    displayWidth: 4,
    displayHeight: 9,
    x: 80,
    y: 150,
    rotation: 0,
  },
  {
    id: "camera",
    name: "Instax Kamera",
    image: intaxImg,
    width: 10,
    height: 10,
    displayWidth: 4,
    displayHeight: 6,
    x: 220,
    y: 180,
    rotation: 0,
  },
]);

// Scaling logic: 1cm = (containerHeight / bagRealHeight) pixels
const pxPerCm = computed(() => {
  if (!containerHeight.value) return 15; // fallback
  return containerHeight.value / bagRealHeight;
});

// Draggable and Rotation logic for each item
const selectedItemId = ref<string | null>(null);

function selectItem(id: string) {
  selectedItemId.value = id;
}

function rotateItem(id: string, degrees: number) {
  const item = activeItems.value.find(i => i.id === id);
  if (item) {
    item.rotation = (item.rotation + degrees) % 360;
  }
}

// Handle dragging manually
const isDragging = ref(false);
let startMouseX = 0;
let startMouseY = 0;
let startItemX = 0;
let startItemY = 0;

function startDrag(event: MouseEvent | TouchEvent, item: Item) {
  selectedItemId.value = item.id;
  isDragging.value = true;
  
  const clientX = 'touches' in event ? (event.touches?.[0]?.clientX ?? 0) : event.clientX;
  const clientY = 'touches' in event ? (event.touches?.[0]?.clientY ?? 0) : event.clientY;
  
  startMouseX = clientX;
  startMouseY = clientY;
  startItemX = item.x;
  startItemY = item.y;

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
}

function onDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || !selectedItemId.value) return;
  
  const clientX = 'touches' in event ? (event.touches?.[0]?.clientX ?? 0) : event.clientX;
  const clientY = 'touches' in event ? (event.touches?.[0]?.clientY ?? 0) : event.clientY;
  
  const dx = clientX - startMouseX;
  const dy = clientY - startMouseY;
  
  const item = activeItems.value.find(i => i.id === selectedItemId.value);
  if (item) {
    item.x = startItemX + dx;
    item.y = startItemY + dy;
  }
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
}

</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-background rounded-3xl border border-border shadow-xl overflow-hidden max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center space-y-2">
<!--       <h3 class="text-2xl font-bold">Boyut Görselleştirici</h3>
     

<p class="text-sm text-muted-foreground">Eşyaları çanta üzerine sürükleyerek boyutlarını kıyaslayabilirsiniz.</p>
 -->    </div>

    <div class="flex flex-col md:flex-row gap-8 items-center justify-center">
      <!-- Main View: Bag Canvas -->
      <div 
        ref="containerRef"
        class="relative w-full max-w-[500px] aspect-square bg-secondary/20 rounded-2xl border border-border overflow-hidden cursor-crosshair select-none"
      >
        <!-- Grid -->
        <div class="absolute inset-0 opacity-5 pointer-events-none" 
             style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 20px 20px;">
        </div>

        <!-- Bag Image -->
        <img :src="bagImage" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal opacity-90" draggable="false" />

        <!-- Draggable Items Layer -->
        <div 
          v-for="item in activeItems" 
          :key="item.id"
          class="absolute cursor-move group transition-shadow"
          :style="{
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: `${item.width * pxPerCm}px`,
            height: `${item.height * pxPerCm}px`,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
            zIndex: selectedItemId === item.id ? 50 : 10
          }"
          @mousedown.stop="startDrag($event, item)"
          @touchstart.stop="startDrag($event, item)"
        >
          <!-- Rotation Handle Interface -->
          <div v-if="selectedItemId === item.id" class="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 p-1 bg-background border border-border rounded-full shadow-lg z-[60]">
             <Button size="icon" variant="ghost" aria-label="Sola döndür" class="h-8 w-8 rounded-full" @mousedown.stop @click.stop="rotateItem(item.id, -45)">
              <RotateCw class="h-4 w-4 scale-x-[-1]" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Sağa döndür" class="h-8 w-8 rounded-full" @mousedown.stop @click.stop="rotateItem(item.id, 45)">
              <RotateCw class="h-4 w-4" />
            </Button>
          </div>

          <div class="relative w-full h-full">
             <!-- Selection Border -->
            <div 
              v-if="selectedItemId === item.id"
              class="absolute inset-[-4px] border-2 border-primary rounded-lg pointer-events-none"
            ></div>
            
            <img 
              :src="item.image" 
              class="w-full h-full object-contain drop-shadow-md select-none" 
              draggable="false" 
            />
            
            <!-- Dimensions Label -->
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-100 transition-opacity">
              {{ item.displayWidth || item.width }} x {{ item.displayHeight || item.height }} cm
            </div>
          </div>
        </div>
        
        <!-- Selection reset overlay -->
        <div v-if="selectedItemId" class="absolute inset-0 z-0" @mousedown="selectedItemId = null"></div>
      </div>

      <!-- Info Card -->
      <div class="w-full md:w-64 space-y-4">
        <div class="p-4 bg-secondary/30 rounded-2xl border border-border">
          <h4 class="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">Eşya Bilgileri</h4>
          <div class="space-y-3">
             <div v-for="item in activeItems" :key="item.id" class="flex items-center gap-3">
               <div class="w-10 h-10 rounded-lg bg-background border border-border p-1">
                 <img :src="item.image" class="w-full h-full object-contain" />
               </div>
               <div>
                 <div class="text-sm font-medium">{{ item.name }}</div>
                 <div class="text-xs text-muted-foreground">{{ item.displayWidth || item.width }}x{{ item.displayHeight || item.height }} cm</div>
               </div>
             </div>
          </div>
        </div>

        <div class="p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <div class="flex items-start gap-2 text-primary">
            <Info class="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p class="text-[11px] leading-relaxed">Çanta dış yüksekliği {{ bagRealHeight }}cm olarak baz alınmıştır.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-grab {
  cursor: grab;
}
.cursor-grabbing {
  cursor: grabbing;
}
</style>
