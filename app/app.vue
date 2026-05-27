<template>
  <div class="min-h-screen bg-gradient-to-b from-bdo-darkest via-bdo-dark to-bdo-darkest text-bdo-text flex flex-col antialiased">
    
    <!-- Top Navigation Bar -->
    <header class="border-b border-bdo-border/30 bg-bdo-darkest/80 backdrop-blur-md sticky top-0 z-50 py-3.5 px-6 md:px-10 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-bdo-goldDark to-bdo-gold flex items-center justify-center shadow-md shadow-bdo-gold/15">
          <DiscIcon class="h-4.5 w-4.5 text-bdo-darkest animate-spin-slow" />
        </div>
        <div>
          <h1 class="text-lg font-black tracking-wider text-glow bg-gradient-to-r from-bdo-goldBright via-bdo-gold to-bdo-goldDark bg-clip-text text-transparent uppercase">
            Marnian Studio
          </h1>
          <p class="text-[9px] text-bdo-textDim tracking-widest uppercase font-semibold">MIDI to BDO Composer</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <span class="hidden md:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full bg-bdo-gold/10 text-bdo-gold border border-bdo-gold/20 items-center space-x-1 animate-pulse-slow">
          <SparklesIcon class="h-3 w-3" />
          <span>100% Client-Side Processing</span>
        </span>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT SECTION: Creative Workspace (col-span-8) -->
      <section class="lg:col-span-8 space-y-6">
        
        <!-- File Input & Drag/Drop Card -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          class="relative rounded-2xl border border-bdo-border bg-bdo-light/30 transition-all duration-300 overflow-hidden"
          :class="[isDragging ? 'ring-2 ring-bdo-gold border-transparent bg-bdo-gold/5' : '']"
        >
          <!-- Upload state -->
          <div v-if="isLoading" class="p-12 text-center space-y-4">
            <div class="h-10 w-10 rounded-full border-3 border-bdo-gold/20 border-t-bdo-gold animate-spin mx-auto"></div>
            <p class="text-xs text-bdo-gold font-bold tracking-wider uppercase">Parsing MIDI data...</p>
          </div>

          <!-- Active MIDI file summary & visualization -->
          <div v-else-if="parsedMidi" class="p-5 space-y-5">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bdo-border/20 pb-4">
              <div class="flex items-center space-x-3">
                <div class="h-11 w-11 rounded-xl bg-bdo-gold/10 text-bdo-gold border border-bdo-gold/20 flex items-center justify-center shadow-inner">
                  <FileMusicIcon class="h-6 w-6" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-white truncate max-w-xs md:max-w-md">{{ fileName }}</h3>
                  <p class="text-[10px] text-bdo-gold font-mono font-bold uppercase mt-0.5">
                    {{ formatBytes(midiSize) }} · {{ parsedMidi.channels.length }} active channels
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button 
                  @click="triggerFileInput"
                  class="px-3.5 py-1.5 rounded-lg border border-bdo-border bg-bdo-surface hover:bg-bdo-surfaceAlt hover:border-bdo-borderLight text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Change File
                </button>
                <button 
                  @click="clearFile"
                  class="px-3.5 py-1.5 rounded-lg border border-red-950/20 bg-red-950/10 hover:bg-red-950/20 hover:border-red-900/40 text-red-400 text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Remove
                </button>
              </div>
            </div>

            <!-- Dashboard Mini Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-bdo-darkest/60 rounded-xl p-3 border border-bdo-border/20 flex flex-col justify-center">
                <span class="text-[9px] text-bdo-textDim uppercase tracking-widest font-semibold">Total Notes</span>
                <span class="text-md font-extrabold text-white mt-0.5">{{ parsedMidi.totalNotes }}</span>
              </div>
              
              <div class="bg-bdo-darkest/60 rounded-xl p-3 border border-bdo-border/20 flex flex-col justify-center">
                <span class="text-[9px] text-bdo-textDim uppercase tracking-widest font-semibold">Original BPM</span>
                <span class="text-md font-extrabold text-white mt-0.5 flex items-baseline space-x-1">
                  <span>{{ parsedMidi.bpm }}</span>
                  <span v-if="parsedMidi.tempoChangesCount > 1" class="text-[9px] text-bdo-gold font-bold">
                    ({{ parsedMidi.tempoChangesCount }} changes)
                  </span>
                </span>
              </div>

              <div class="bg-bdo-darkest/60 rounded-xl p-3 border border-bdo-border/20 flex flex-col justify-center">
                <span class="text-[9px] text-bdo-textDim uppercase tracking-widest font-semibold">Signature</span>
                <span class="text-md font-extrabold text-white mt-0.5">{{ parsedMidi.timeSig }}/4</span>
              </div>

              <div class="bg-bdo-darkest/60 rounded-xl p-3 border border-bdo-border/20 flex flex-col justify-center">
                <span class="text-[9px] text-bdo-textDim uppercase tracking-widest font-semibold">Total Duration</span>
                <span class="text-md font-extrabold text-white mt-0.5">{{ formatDuration(parsedMidi.durationMs) }}</span>
              </div>
            </div>

            <!-- Piano Roll visualization canvas -->
            <div class="bg-bdo-darkest rounded-xl border border-bdo-border/40 overflow-hidden relative">
              <div class="absolute top-2 right-3 z-10 bg-bdo-darkest/80 px-2 py-0.5 rounded border border-bdo-border/30 text-[9px] text-bdo-gold font-mono tracking-wider">
                Range: {{ formatRange() }}
              </div>
              <canvas ref="pianoRollCanvas" class="w-full h-40 block bg-[#0b0b0c]"></canvas>
            </div>

            <!-- INTERACTIVE PREVIEW CONTROLS -->
            <div class="bg-bdo-darkest/40 border border-bdo-border/25 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
              <div class="flex items-center space-x-3">
                <!-- Play / Pause -->
                <button 
                  @click="togglePlay"
                  class="h-9 w-9 rounded-lg bg-bdo-gold text-bdo-darkest hover:bg-bdo-goldLight flex items-center justify-center shadow transition-all duration-300 transform active:scale-95"
                  :title="isPlaying ? 'Pause' : 'Play Preview'"
                >
                  <PauseIcon v-if="isPlaying" class="h-4.5 w-4.5 text-bdo-darkest" />
                  <PlayIcon v-else class="h-4.5 w-4.5 text-bdo-darkest fill-bdo-darkest" />
                </button>
                
                <!-- Stop -->
                <button 
                  @click="stopPlayback"
                  class="h-9 w-9 rounded-lg border border-bdo-border bg-bdo-surface hover:bg-bdo-surfaceAlt hover:border-bdo-borderLight text-bdo-textDim hover:text-white flex items-center justify-center transition-all duration-300 transform active:scale-95"
                  title="Stop"
                >
                  <SquareIcon class="h-4 w-4 fill-current" />
                </button>

                <!-- Time display -->
                <div class="text-[10px] text-bdo-textDim font-mono font-bold select-none pl-1">
                  <span class="text-white">{{ formatDuration(playbackTimeMs) }}</span>
                  <span class="mx-1">/</span>
                  <span>{{ formatDuration(totalDurationMs) }}</span>
                </div>
              </div>

              <!-- Seek Scrubber -->
              <div class="flex-1 px-1">
                <input 
                  type="range" 
                  :value="playbackTimeMs"
                  @input="handleSeek"
                  min="0" 
                  :max="totalDurationMs" 
                  class="w-full accent-bdo-gold bg-bdo-surface h-1 rounded-lg appearance-none cursor-pointer"
                  :disabled="totalDurationMs === 0"
                />
              </div>

              <!-- Volume controls -->
              <div class="flex items-center space-x-2.5">
                <button 
                  @click="isMuted = !isMuted"
                  class="text-bdo-textDim hover:text-white transition-colors"
                >
                  <VolumeXIcon v-if="isMuted || previewVolume === 0" class="h-4.5 w-4.5 text-bdo-gold" />
                  <Volume2Icon v-else class="h-4.5 w-4.5 text-bdo-gold" />
                </button>
                
                <input 
                  type="range" 
                  v-model.number="previewVolume"
                  min="0" 
                  max="100" 
                  class="w-20 accent-bdo-gold bg-bdo-surface h-1 rounded-lg appearance-none cursor-pointer"
                />
                <span class="text-[9px] text-bdo-textDim font-mono font-bold w-6 text-right select-none">
                  {{ isMuted ? 0 : previewVolume }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Empty upload state -->
          <div 
            v-else 
            @click="triggerFileInput"
            class="p-12 text-center space-y-4 cursor-pointer hover:bg-bdo-light/40 transition-colors"
          >
            <div class="h-14 w-14 rounded-2xl bg-bdo-surface/60 text-bdo-textDim border border-bdo-border flex items-center justify-center mx-auto shadow-inner transition-transform hover:scale-105 duration-300">
              <UploadCloudIcon class="h-7 w-7 text-bdo-gold" />
            </div>
            <div class="space-y-1">
              <p class="text-xs font-extrabold uppercase tracking-widest text-white">Drag & drop your MIDI file here</p>
              <p class="text-[10px] text-bdo-textDim">Or click to browse your local computer storage</p>
            </div>
            <p class="text-[9px] text-bdo-gold/60 tracking-widest uppercase font-bold pt-4">Supports standard .mid and .midi files</p>
          </div>

          <input 
            type="file" 
            ref="fileInput" 
            accept=".mid,.midi" 
            class="hidden" 
            @change="handleFileChange" 
          />
        </div>

        <!-- MIDI Channels & Instrument Workstation (Figma/DAW style) -->
        <div class="bdo-glass rounded-2xl p-5 border border-bdo-border/40 space-y-4">
          <div class="flex items-center justify-between border-b border-bdo-border/20 pb-3">
            <div class="flex items-center space-x-2">
              <DiscIcon class="h-4.5 w-4.5 text-bdo-gold animate-spin-slow" />
              <h3 class="text-xs font-black text-bdo-goldLight uppercase tracking-widest">Channel Workstation</h3>
            </div>
            <span v-if="parsedMidi" class="text-[10px] font-bold px-2 py-0.5 rounded bg-bdo-surface text-bdo-gold">
              {{ parsedMidi.channels.length }} Tracks Loaded
            </span>
          </div>

          <!-- If no file loaded -->
          <div v-if="!parsedMidi" class="text-center py-16 space-y-3">
            <MusicIcon class="h-10 w-10 text-bdo-border/60 mx-auto" />
            <p class="text-xs text-bdo-textDim font-medium">Configure instruments and gain levels once a MIDI file is uploaded.</p>
          </div>

          <!-- Active channels workspace -->
          <div v-else class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            
            <!-- Global Group Merger Tool -->
            <div class="bg-bdo-surface/25 border border-bdo-border/40 p-3 rounded-xl flex items-center justify-between gap-4">
              <div class="flex flex-col text-left">
                <span class="text-[9px] font-black text-bdo-gold uppercase tracking-wider">Global Mapping Tool</span>
                <span class="text-[9px] text-bdo-textDim mt-0.5">Quickly merge all non-percussion tracks into one instrument</span>
              </div>
              
              <div class="flex items-center space-x-2">
                <select 
                  v-model="mergeTarget"
                  class="bg-bdo-darkest border border-bdo-border rounded-lg text-xs py-1.5 px-2.5 text-white focus:outline-none focus:border-bdo-gold"
                >
                  <option v-for="[id, name] in Object.entries(BDO_INSTRUMENT_NAMES)" :key="id" :value="parseInt(id)">
                    {{ name }}
                  </option>
                </select>
                <button 
                  @click="applyMergeAll"
                  class="px-3.5 py-1.5 rounded-lg bg-bdo-gold text-bdo-darkest text-xs font-bold uppercase tracking-wider hover:bg-bdo-goldLight transition-all"
                >
                  Apply All
                </button>
              </div>
            </div>

            <!-- Channel rows -->
            <div 
              v-for="chGroup in parsedMidi.channels" 
              :key="chGroup.channel" 
              class="bg-bdo-darkest/45 hover:bg-bdo-light/20 border border-bdo-border/20 hover:border-bdo-border/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <!-- Info block -->
              <div class="flex-1 min-w-0 text-left">
                <div class="flex items-center space-x-2">
                  <span class="h-2 w-2 rounded-full" :class="chGroup.isPercussion ? 'bg-bdo-gold animate-pulse' : 'bg-bdo-borderLight'"></span>
                  <p class="text-xs font-extrabold text-white truncate max-w-[240px]" :title="chGroup.name">
                    {{ chGroup.name }}
                  </p>
                </div>
                <p class="text-[9px] text-bdo-textDim font-semibold uppercase tracking-wider mt-1 ml-4">
                  Channel {{ chGroup.channel + 1 }} · {{ chGroup.notesCount }} notes
                </p>
              </div>

              <!-- Volume gain slider -->
              <div class="flex items-center space-x-3 md:w-44 bg-bdo-surface/15 py-1.5 px-3 rounded-lg border border-bdo-border/10">
                <Volume2Icon class="h-3.5 w-3.5 text-bdo-textDim" />
                <input 
                  type="range" 
                  :value="getChannelVolume(chGroup.channel)"
                  @input="setChannelVolume(chGroup.channel, $event)"
                  min="10" 
                  max="200" 
                  step="10"
                  class="flex-1 accent-bdo-gold bg-bdo-surface h-1 rounded appearance-none cursor-pointer"
                />
                <span class="text-[10px] text-bdo-gold font-mono font-bold min-w-[28px] text-right">
                  {{ getChannelVolume(chGroup.channel) }}%
                </span>
              </div>

              <!-- Instrument select -->
              <div class="flex flex-col md:w-44 text-right">
                <select 
                  :value="getInstrumentMapping(chGroup.gmProgram, chGroup.isPercussion)"
                  @change="setInstrumentMapping(chGroup.gmProgram, chGroup.isPercussion, $event)"
                  class="w-full bg-bdo-surface border border-bdo-border rounded-lg text-xs py-1.5 px-2.5 text-white focus:outline-none focus:border-bdo-gold"
                >
                  <option v-for="[id, name] in Object.entries(BDO_INSTRUMENT_NAMES)" :key="id" :value="parseInt(id)">
                    {{ name }}
                  </option>
                </select>
              </div>

            </div>
          </div>
        </div>

      </section>

      <!-- RIGHT SECTION: Audio Inspector & Engine controls (col-span-4) -->
      <section class="lg:col-span-4 space-y-6">
        
        <!-- Compile and Export Panel -->
        <div class="bg-gradient-to-tr from-bdo-dark to-bdo-light border border-bdo-gold/30 rounded-2xl p-5 text-center space-y-4 shadow-xl relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-bdo-gold/10 blur-2xl pointer-events-none"></div>
          
          <div class="relative space-y-4">
            <div class="space-y-1">
              <h3 class="text-xs font-black text-white uppercase tracking-widest">Compile Partition</h3>
              <p class="text-[10px] text-bdo-textDim">
                Processes all settings, transpositions, and velocity maps, then exports the encrypted v9 BDO composition file.
              </p>
            </div>

            <button 
              @click="convertFile"
              :disabled="!parsedMidi"
              class="w-full py-3.5 px-6 rounded-xl text-bdo-darkest text-xs font-black uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              :class="[
                parsedMidi 
                  ? 'bg-gradient-to-r from-bdo-goldLight via-bdo-gold to-bdo-goldDark hover:from-bdo-goldBright hover:to-bdo-gold hover:scale-[1.02] shadow-bdo-gold/25 cursor-pointer text-shadow'
                  : 'bg-bdo-surface text-bdo-textDim border border-bdo-border cursor-not-allowed opacity-50'
              ]"
            >
              <Wand2Icon class="h-4.5 w-4.5" />
              <span>Compile & Export (.ms2)</span>
            </button>
          </div>
        </div>

        <!-- Compilation Output summary -->
        <div v-if="conversionSummary" class="bdo-glass rounded-2xl p-5 space-y-3.5 border border-green-900/30 bg-green-950/5">
          <div class="flex items-center space-x-2 text-green-400">
            <CheckCircle2Icon class="h-4.5 w-4.5" />
            <h4 class="text-xs font-black uppercase tracking-wider">Compilation Success !</h4>
          </div>
          
          <div class="text-[11px] space-y-2 text-bdo-textDim font-semibold">
            <div class="flex justify-between py-1 border-b border-bdo-border/10">
              <span>Output BPM</span>
              <span class="font-extrabold text-white font-mono">{{ conversionSummary.bpm }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-bdo-border/10">
              <span>BDO Instruments</span>
              <span class="font-extrabold text-white font-mono">{{ conversionSummary.instruments }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-bdo-border/10">
              <span>Total Tracks</span>
              <span class="font-extrabold text-white font-mono">{{ conversionSummary.tracks }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-bdo-border/10">
              <span>Encoded Notes</span>
              <span class="font-extrabold text-white font-mono">{{ conversionSummary.total_notes }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-bdo-border/10">
              <span>Dropped Notes (10k limit)</span>
              <span class="font-extrabold font-mono" :class="conversionSummary.notes_dropped > 0 ? 'text-bdo-error font-black' : 'text-white'">
                {{ conversionSummary.notes_dropped }}
              </span>
            </div>
          </div>
        </div>

        <!-- Audio Inspector (TABBED panel) -->
        <div class="bdo-glass rounded-2xl border border-bdo-border/40 overflow-hidden flex flex-col">
          <!-- Tab Navigation headers -->
          <div class="flex bg-bdo-darkest/90 border-b border-bdo-border/20 text-center">
            <button 
              v-for="tab in ['general', 'velocity', 'effector']" 
              :key="tab"
              @click="activeInspectorTab = tab"
              class="flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2"
              :class="[
                activeInspectorTab === tab 
                  ? 'text-bdo-gold border-bdo-gold bg-bdo-light/35' 
                  : 'text-bdo-textDim border-transparent hover:text-white hover:bg-bdo-light/10'
              ]"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Inspector Content area -->
          <div class="p-5 space-y-4 bg-bdo-dark/15 min-h-[300px]">
            
            <!-- GENERAL SETTINGS TAB -->
            <div v-show="activeInspectorTab === 'general'" class="space-y-4 text-left">
              <div>
                <label class="block text-[10px] font-bold text-bdo-textDim mb-1.5 uppercase tracking-wider">Character Name</label>
                <input 
                  type="text" 
                  v-model="charName" 
                  maxlength="31"
                  placeholder="ex: ArcherSymphony"
                  class="w-full bg-bdo-surface/70 border border-bdo-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-bdo-gold transition-colors"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-bdo-textDim mb-1.5 uppercase tracking-wider">
                  Owner ID (Family ID)
                </label>
                <div class="relative">
                  <input 
                    type="number" 
                    v-model.number="ownerId" 
                    placeholder="0"
                    class="w-full bg-bdo-surface/70 border border-bdo-border rounded-xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-bdo-gold transition-colors font-mono"
                  />
                  <div class="absolute right-2.5 top-1/2 -translate-y-1/2 group cursor-pointer">
                    <InfoIcon class="h-3.5 w-3.5 text-bdo-textDim hover:text-bdo-gold transition-colors" />
                    <!-- Tooltip -->
                    <div class="absolute bottom-full right-0 mb-2 w-56 bg-bdo-surface border border-bdo-border p-2.5 rounded-lg shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-20 text-[10px] font-medium text-bdo-text leading-relaxed">
                      Embeds your account signature so you can edit the composition in-game. Defaults to <span class="text-bdo-gold font-bold">0</span> for read-only.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Owner ID file extraction tool -->
              <div class="border-t border-bdo-border/10 pt-3 space-y-1.5">
                <span class="block text-[9px] font-black text-bdo-gold uppercase tracking-wider">
                  Auto-Extract Owner ID
                </span>
                
                <div 
                  @click="triggerOwnerFileInput"
                  class="bg-bdo-darkest/50 hover:bg-bdo-surface/40 border border-dashed border-bdo-border hover:border-bdo-gold/40 rounded-xl p-2.5 flex items-center justify-center space-x-2.5 cursor-pointer transition-all"
                >
                  <FolderOpenIcon class="h-4 w-4 text-bdo-gold" />
                  <span class="text-[10px] font-semibold truncate" :class="ownerIdStatus ? (ownerIdStatus.error ? 'text-bdo-error' : 'text-bdo-goldLight') : 'text-bdo-textDim'">
                    {{ ownerIdStatus ? ownerIdStatus.text : "Select a 1-note BDO file" }}
                  </span>
                  <input 
                    type="file" 
                    ref="ownerFileInput" 
                    accept="*" 
                    class="hidden" 
                    @change="handleOwnerFileChange" 
                  />
                </div>
              </div>

              <!-- BPM & Transpose -->
              <div class="grid grid-cols-2 gap-3.5 border-t border-bdo-border/10 pt-3">
                <div>
                  <label class="block text-[10px] font-bold text-bdo-textDim mb-1.5 uppercase tracking-wider">BPM Override</label>
                  <input 
                    type="number" 
                    v-model.number="bpmOverride" 
                    placeholder="Original"
                    class="w-full bg-bdo-surface/70 border border-bdo-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-bdo-gold transition-colors"
                  />
                </div>

                <div class="text-left flex flex-col justify-between">
                  <label class="block text-[10px] font-bold text-bdo-textDim uppercase tracking-wider">Transpose</label>
                  <div class="text-xs text-bdo-gold font-mono font-bold py-1">
                    {{ transpose > 0 ? '+' : '' }}{{ transpose }} Semitones
                  </div>
                </div>
              </div>

              <div class="pt-1">
                <input 
                  type="range" 
                  v-model.number="transpose" 
                  min="-36" 
                  max="36" 
                  class="w-full accent-bdo-gold bg-bdo-surface h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <!-- Options -->
              <div class="space-y-2 border-t border-bdo-border/10 pt-3">
                <label class="flex items-center space-x-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="applySustain"
                    class="h-4 w-4 rounded border-bdo-border text-bdo-gold focus:ring-bdo-gold/30 accent-bdo-gold bg-bdo-surface"
                  />
                  <span class="text-[11px] font-bold text-bdo-textDim hover:text-white transition-colors">
                    Extend Notes (Sustain CC64)
                  </span>
                </label>

                <label class="flex items-center space-x-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="flattenTempo"
                    class="h-4 w-4 rounded border-bdo-border text-bdo-gold focus:ring-bdo-gold/30 accent-bdo-gold bg-bdo-surface"
                  />
                  <span class="text-[11px] font-bold text-bdo-textDim hover:text-white transition-colors">
                    Tempo Flattening
                  </span>
                </label>
              </div>
            </div>

            <!-- VELOCITY SETTINGS TAB -->
            <div v-show="activeInspectorTab === 'velocity'" class="space-y-4 text-left">
              <!-- Mode Selection Dropdown -->
              <div>
                <label class="block text-[10px] font-bold text-bdo-textDim mb-1.5 uppercase tracking-wider">Processing Mode</label>
                <select 
                  v-model="velocityMode"
                  class="w-full bg-bdo-surface/75 border border-bdo-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-bdo-gold"
                >
                  <option value="layered">Layered (Recommended)</option>
                  <option value="stepped">Stepped (Discrete Levels)</option>
                  <option value="rescale">Rescale (Min/Max Range)</option>
                  <option value="floor">Floor (Volume Boost)</option>
                  <option value="off">Off (Original Velocity)</option>
                </select>
              </div>

              <!-- Detailed description context box -->
              <div class="p-3.5 rounded-xl bg-bdo-darkest/50 border border-bdo-border/20 text-[10px] text-bdo-textDim leading-relaxed min-h-[90px] flex flex-col justify-center">
                <!-- Layered -->
                <div v-if="velocityMode === 'layered'">
                  <p class="font-bold text-white uppercase tracking-wider">Layered Processing</p>
                  <p class="mt-1">
                    Maps note velocities to discrete gaming steps <span class="text-bdo-gold font-bold font-mono">[80, 90, 100, 121]</span>. 
                    This matches the raw dynamic layers of BDO instruments, avoiding weird instrument model glitches in-game.
                  </p>
                </div>

                <!-- Stepped -->
                <div v-if="velocityMode === 'stepped'" class="space-y-2">
                  <div>
                    <p class="font-bold text-white uppercase tracking-wider">Stepped Levels</p>
                    <p class="mt-0.5">Locks velocities into arithmetic steps starting from a base volume.</p>
                  </div>
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span class="text-[9px] text-bdo-textDim block uppercase">Base</span>
                      <input type="number" v-model.number="steppedBase" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                    <div>
                      <span class="text-[9px] text-bdo-textDim block uppercase">Step</span>
                      <input type="number" v-model.number="steppedStep" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <!-- Rescale -->
                <div v-if="velocityMode === 'rescale'" class="space-y-2">
                  <div>
                    <p class="font-bold text-white uppercase tracking-wider">Rescale Range</p>
                    <p class="mt-0.5">Fits all velocities into a custom scale bounded by a strict minimum and maximum value.</p>
                  </div>
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span class="text-[9px] text-bdo-textDim block uppercase">Min</span>
                      <input type="number" v-model.number="rescaleMin" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                    <div>
                      <span class="text-[9px] text-bdo-textDim block uppercase">Max</span>
                      <input type="number" v-model.number="rescaleMax" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <!-- Floor -->
                <div v-if="velocityMode === 'floor'" class="space-y-2">
                  <div>
                    <p class="font-bold text-white uppercase tracking-wider">Floor Gain Boost</p>
                    <p class="mt-0.5">Proportionally scales volumes so the quietest note is equal to the floor, boosting overall sound level.</p>
                  </div>
                  <div class="pt-1">
                    <span class="text-[9px] text-bdo-textDim block uppercase">Floor Threshold</span>
                    <input type="number" v-model.number="floorVal" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                  </div>
                </div>

                <!-- Off -->
                <div v-if="velocityMode === 'off'">
                  <p class="font-bold text-white uppercase tracking-wider">Original Velocity</p>
                  <p class="mt-1">Passes all velocity levels through raw from the MIDI file without altering them.</p>
                </div>
              </div>
            </div>

            <!-- EFFECTOR TAB -->
            <div v-show="activeInspectorTab === 'effector'" class="space-y-4 text-left">
              <!-- Reverb -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[10px] font-bold">
                  <span class="text-bdo-textDim uppercase tracking-wider">Global Reverb</span>
                  <span class="text-bdo-gold font-mono">{{ reverb }}</span>
                </div>
                <input 
                  type="range" 
                  v-model.number="reverb" 
                  min="0" 
                  max="127" 
                  class="w-full accent-bdo-gold bg-bdo-surface h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <!-- Delay -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[10px] font-bold">
                  <span class="text-bdo-textDim uppercase tracking-wider">Global Delay</span>
                  <span class="text-bdo-gold font-mono">{{ delay }}</span>
                </div>
                <input 
                  type="range" 
                  v-model.number="delay" 
                  min="0" 
                  max="127" 
                  class="w-full accent-bdo-gold bg-bdo-surface h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <!-- Chorus Panel -->
              <div class="border-t border-bdo-border/10 pt-3 space-y-3">
                <span class="block text-[10px] font-black text-bdo-goldLight uppercase tracking-widest">Chorus Modulator</span>
                
                <div class="grid grid-cols-3 gap-3">
                  <!-- Feedback -->
                  <div class="space-y-1">
                    <span class="text-[9px] text-bdo-textDim block uppercase font-bold">FB</span>
                    <input type="number" v-model.number="chorusFeedback" min="0" max="127" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                  </div>
                  <!-- Depth -->
                  <div class="space-y-1">
                    <span class="text-[9px] text-bdo-textDim block uppercase font-bold">Depth</span>
                    <input type="number" v-model.number="chorusDepth" min="0" max="127" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                  </div>
                  <!-- Freq -->
                  <div class="space-y-1">
                    <span class="text-[9px] text-bdo-textDim block uppercase font-bold">Freq</span>
                    <input type="number" v-model.number="chorusFreq" min="0" max="127" class="w-full bg-bdo-surface border border-bdo-border rounded px-2 py-1 text-white font-mono text-xs" />
                  </div>
                </div>
                
                <div class="text-[9px] text-bdo-textDim italic leading-relaxed pt-1">
                  Adjust Chorus modulator variables to add wide stereo spatialization. Left at 0 for no chorus effect.
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-bdo-border/20 py-5 px-6 text-center text-[10px] text-bdo-textDim bg-bdo-darkest/50 space-y-1.5">
      <p class="font-bold text-bdo-gold">Marnian Studio — BDO Music Sheet Encoder (v9)</p>
      <p class="font-medium tracking-wide">
        Secure & Local · All MIDI parses, decryptions, and binary packages occur safely within your web browser.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, watch, onUnmounted } from 'vue';
import { 
  Music as MusicIcon, 
  Sparkles as SparklesIcon, 
  UploadCloud as UploadCloudIcon, 
  FileMusic as FileMusicIcon, 
  Info as InfoIcon,
  Sliders as SlidersIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  FolderOpen as FolderOpenIcon,
  Wand2 as Wand2Icon,
  Volume2 as Volume2Icon,
  Disc as DiscIcon,
  CheckCircle2 as CheckCircle2Icon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as SquareIcon,
  VolumeX as VolumeXIcon
} from 'lucide-vue-next';

// import helper modules
import { 
  parseMidiFile, 
  gmToBdoInstrument, 
  BDO_INSTRUMENT_NAMES, 
  transposeAndClampNotes,
  mapDrumNotes,
  rescaleVelocity,
  floorVelocity,
  steppedVelocity,
  layeredVelocity,
  splitNotesIntoTracks,
  MAX_NOTES_PER_TRACK,
  MAX_NOTES_PER_INSTRUMENT,
  type ParsedMidiResult,
  type BdoNote
} from '~/utils/midiProcessor';

import { 
  buildBdoBinary, 
  encryptBdo, 
  extractOwnerId,
  makeTrackSettings,
  type BdoInstrumentGroup
} from '~/utils/bdoBinary';

import { playBdoNote } from '~/utils/audioSynth';
import confetti from 'canvas-confetti';

// Template refs
const fileInput = ref<HTMLInputElement | null>(null);
const ownerFileInput = ref<HTMLInputElement | null>(null);
const pianoRollCanvas = ref<HTMLCanvasElement | null>(null);

// Active layout tab
const activeInspectorTab = ref('general');

// State variables
const isDragging = ref(false);
const isLoading = ref(false);
const fileName = ref('');
const midiSize = ref(0);
const midiFile = ref<ArrayBuffer | null>(null);
const parsedMidi = ref<ParsedMidiResult | null>(null);
const mergeTarget = ref(0x11); // default Florchestra Piano

// Global settings
const charName = ref('MIDI');
const ownerId = ref(0);
const bpmOverride = ref<number | ''>('');
const transpose = ref(0);
const applySustain = ref(true);
const flattenTempo = ref(false);
const ownerIdStatus = ref<{ text: string; error: boolean } | null>(null);

// Velocity Settings
const velocityMode = ref<'layered' | 'stepped' | 'rescale' | 'floor' | 'off'>('layered');
const steppedBase = ref(99);
const steppedStep = ref(5);
const rescaleMin = ref(80);
const rescaleMax = ref(127);
const floorVal = ref(100);

// Effector Settings
const reverb = ref(0);
const delay = ref(0);
const chorusFeedback = ref(0);
const chorusDepth = ref(0);
const chorusFreq = ref(0);

// Dynamic Mappings Storage
const instrumentMappings = reactive(new Map<string, number>());
const channelVolumeScales = reactive(new Map<number, number>());

// Output Conversion Summary
const conversionSummary = ref<any | null>(null);

// Audio Playback Workstation State
const audioCtx = ref<AudioContext | null>(null);
const masterGain = ref<GainNode | null>(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const previewVolume = ref(80); // 0-100
const playbackTimeMs = ref(0);
const totalDurationMs = computed(() => parsedMidi.value?.durationMs ?? 0);

interface PlaybackNote {
  noteId: string;
  startSec: number;
  durSec: number;
  pitch: number;
  vel: number;
  instId: number;
}

let playbackNotesList: PlaybackNote[] = [];
const scheduledNoteKeys = new Set<string>();
let audioStartTime = 0;
const lookAheadMs = 120;
let timerIntervalId: any = null;
let animationFrameId: number | null = null;



// Watch settings and re-draw canvas
watch([parsedMidi, transpose], () => {
  if (parsedMidi.value) {
    nextTick(() => {
      drawPianoRoll();
    });
  }
});

// Re-parse MIDI file when sustain or flatten options change
watch([applySustain, flattenTempo], () => {
  if (midiFile.value) {
    try {
      const result = parseMidiFile(midiFile.value, applySustain.value, flattenTempo.value);
      parsedMidi.value = result;
      nextTick(() => {
        preparePlaybackNotes();
        drawPianoRoll();
      });
    } catch (err) {
      console.error('Re-parse failed:', err);
    }
  }
});

// Rebuild playback timeline when settings or mappings change
watch(
  [transpose, velocityMode, steppedBase, steppedStep, rescaleMin, rescaleMax, floorVal, instrumentMappings, channelVolumeScales],
  () => {
    if (parsedMidi.value) {
      preparePlaybackNotes();
      if (isPlaying.value) {
        // Dynamic update: clear scheduled notes and reset timing relative to current time
        const currentPos = playbackTimeMs.value;
        if (audioCtx.value) {
          scheduledNoteKeys.clear();
          // Flush scheduled audio buffers by briefly restarting context
          audioCtx.value.close();
          audioCtx.value = new (window.AudioContext || (window as any).webkitAudioContext)();
          masterGain.value = audioCtx.value.createGain();
          masterGain.value.gain.setValueAtTime(isMuted.value ? 0 : (previewVolume.value / 100), audioCtx.value.currentTime);
          masterGain.value.connect(audioCtx.value.destination);
          
          audioStartTime = audioCtx.value.currentTime - (currentPos / 1000);
        }
      }
    }
  },
  { deep: true }
);

// Dynamic preview volume watches
watch(previewVolume, (newVal) => {
  if (masterGain.value && audioCtx.value) {
    masterGain.value.gain.setValueAtTime(isMuted.value ? 0 : (newVal / 100), audioCtx.value.currentTime);
  }
});

watch(isMuted, (newMute) => {
  if (masterGain.value && audioCtx.value) {
    masterGain.value.gain.setValueAtTime(newMute ? 0 : (previewVolume.value / 100), audioCtx.value.currentTime);
  }
});

onUnmounted(() => {
  stopPlayback();
});

// Byte formatter
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Duration formatter
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

// Range text generator
function formatRange(): string {
  if (!parsedMidi.value) return '';
  const notes = parsedMidi.value.channels.flatMap(c => c.notes);
  if (notes.length === 0) return '-';
  const pitches = notes.map(n => n.pitch);
  const min = Math.min(...pitches);
  const max = Math.max(...pitches);
  return `${getNoteName(min)} - ${getNoteName(max)}`;
}

// Pitch to Note Name converter
function getNoteName(pitch: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const name = noteNames[pitch % 12];
  return `${name}${octave}`;
}

// File triggers
function triggerFileInput() {
  fileInput.value?.click();
}

function triggerOwnerFileInput() {
  ownerFileInput.value?.click();
}

function clearFile() {
  stopPlayback();
  fileName.value = '';
  midiSize.value = 0;
  midiFile.value = null;
  parsedMidi.value = null;
  conversionSummary.value = null;
  instrumentMappings.clear();
  channelVolumeScales.clear();
}

// Prepare playback timeline notes list
function preparePlaybackNotes() {
  if (!parsedMidi.value) {
    playbackNotesList = [];
    return;
  }

  const list: PlaybackNote[] = [];

  for (const chGroup of parsedMidi.value.channels) {
    let chNotes = [...chGroup.notes];

    if (chGroup.isPercussion) {
      chNotes = mapDrumNotes(chNotes);
    } else {
      chNotes = transposeAndClampNotes(chNotes, transpose.value);
    }

    const volumeScale = (channelVolumeScales.get(chGroup.channel) ?? 100) / 100;

    if (velocityMode.value === 'rescale') {
      chNotes = rescaleVelocity(chNotes, rescaleMin.value, rescaleMax.value);
    } else if (velocityMode.value === 'floor') {
      chNotes = floorVelocity(chNotes, floorVal.value);
    } else if (velocityMode.value === 'stepped') {
      chNotes = steppedVelocity(chNotes, steppedBase.value, steppedStep.value);
    } else if (velocityMode.value === 'layered') {
      chNotes = layeredVelocity(chNotes);
    }

    const targetInstId = getInstrumentMapping(chGroup.gmProgram, chGroup.isPercussion);

    for (let i = 0; i < chNotes.length; i++) {
      const n = chNotes[i];
      const noteVol = Math.max(1, Math.min(127, Math.round(n.vel * volumeScale)));
      
      list.push({
        noteId: `${chGroup.channel}-${i}`,
        startSec: n.start / 1000,
        durSec: n.dur / 1000,
        pitch: n.pitch,
        vel: noteVol,
        instId: targetInstId,
      });
    }
  }

  list.sort((a, b) => a.startSec - b.startSec);
  playbackNotesList = list;
}

// Toggle play and pause state
function togglePlay() {
  if (isPlaying.value) {
    // Pause
    isPlaying.value = false;
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (audioCtx.value) {
      audioCtx.value.close();
      audioCtx.value = null;
      masterGain.value = null;
    }
    // Redraw with cursor at current paused position
    drawPianoRoll();
  } else {
    // Play
    if (!parsedMidi.value) return;
    
    // Safety check: if finished, loop back to start
    if (playbackTimeMs.value >= totalDurationMs.value) {
      playbackTimeMs.value = 0;
    }

    isPlaying.value = true;
    scheduledNoteKeys.clear();
    preparePlaybackNotes(); // final rebuild safeguard

    // Start Audio Context
    audioCtx.value = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain.value = audioCtx.value.createGain();
    masterGain.value.gain.setValueAtTime(isMuted.value ? 0 : (previewVolume.value / 100), audioCtx.value.currentTime);
    masterGain.value.connect(audioCtx.value.destination);

    audioStartTime = audioCtx.value.currentTime - (playbackTimeMs.value / 1000);

    // Precise Scheduler Loop (checks look-ahead window every 40ms)
    scheduleNotes();
    timerIntervalId = setInterval(() => {
      scheduleNotes();
    }, 40);

    // Frame cursor loop (60 FPS smooth updates)
    const updateCursor = () => {
      if (!isPlaying.value || !audioCtx.value) return;

      const currentSongTimeSec = audioCtx.value.currentTime - audioStartTime;
      playbackTimeMs.value = Math.min(totalDurationMs.value, currentSongTimeSec * 1000);

      drawPianoRoll();

      if (playbackTimeMs.value < totalDurationMs.value) {
        animationFrameId = requestAnimationFrame(updateCursor);
      } else {
        stopPlayback();
      }
    };
    animationFrameId = requestAnimationFrame(updateCursor);
  }
}

// Stop playback and reset all cursors and AudioContext state
function stopPlayback() {
  isPlaying.value = false;
  playbackTimeMs.value = 0;
  scheduledNoteKeys.clear();
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (audioCtx.value) {
    audioCtx.value.close();
    audioCtx.value = null;
    masterGain.value = null;
  }
  nextTick(() => {
    drawPianoRoll();
  });
}

// Look-ahead audio scheduler
function scheduleNotes() {
  if (!audioCtx.value || !masterGain.value || !isPlaying.value) return;

  const currentSongTimeSec = audioCtx.value.currentTime - audioStartTime;
  const endLookaheadSec = currentSongTimeSec + (lookAheadMs / 1000);

  if (currentSongTimeSec >= totalDurationMs.value / 1000) {
    stopPlayback();
    return;
  }

  for (const pn of playbackNotesList) {
    if (pn.startSec > endLookaheadSec) {
      break;
    }

    if (pn.startSec >= currentSongTimeSec) {
      if (!scheduledNoteKeys.has(pn.noteId)) {
        scheduledNoteKeys.add(pn.noteId);
        const absolutePlayTime = audioStartTime + pn.startSec;
        playBdoNote(
          audioCtx.value,
          masterGain.value,
          pn.instId,
          pn.pitch,
          pn.vel,
          absolutePlayTime,
          pn.durSec
        );
      }
    }
  }
}

// Seek scrubbing handle
function handleSeek(e: Event) {
  const target = e.target as HTMLInputElement;
  const seekValueMs = parseInt(target.value);
  playbackTimeMs.value = seekValueMs;

  if (isPlaying.value) {
    scheduledNoteKeys.clear();
    if (audioCtx.value) {
      // Flush scheduled nodes by restarting AudioContext
      audioCtx.value.close();
      audioCtx.value = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain.value = audioCtx.value.createGain();
      masterGain.value.gain.setValueAtTime(isMuted.value ? 0 : (previewVolume.value / 100), audioCtx.value.currentTime);
      masterGain.value.connect(audioCtx.value.destination);

      audioStartTime = audioCtx.value.currentTime - (seekValueMs / 1000);
      scheduleNotes();
    }
  } else {
    drawPianoRoll();
  }
}

// Drag & drop drop handler
function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
}

// Process selected file
async function processFile(file: File) {
  if (!file.name.endsWith('.mid') && !file.name.endsWith('.midi')) {
    alert("Please upload a valid MIDI file (.mid or .midi)");
    return;
  }
  
  isLoading.value = true;
  fileName.value = file.name;
  midiSize.value = file.size;
  conversionSummary.value = null;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const arrayBuffer = event.target?.result as ArrayBuffer;
    midiFile.value = arrayBuffer;
    
    try {
      // Parse MIDI
      const result = parseMidiFile(arrayBuffer, applySustain.value, flattenTempo.value);
      parsedMidi.value = result;

      // Auto-enable flatten if multiple tempos detected
      if (result.tempoChangesCount > 1) {
        flattenTempo.value = true;
      }
      
      // Auto-populate default instrument maps
      instrumentMappings.clear();
      channelVolumeScales.clear();
      for (const ch of result.channels) {
        const defaultInst = gmToBdoInstrument(ch.gmProgram, ch.isPercussion);
        instrumentMappings.set(`${ch.gmProgram}-${ch.isPercussion}`, defaultInst);
        channelVolumeScales.set(ch.channel, 100);
      }

      isLoading.value = false;
      nextTick(() => {
        preparePlaybackNotes();
      });
    } catch (err) {
      console.error(err);
      alert("Error parsing MIDI file. It might be corrupted or incompatible.");
      clearFile();
      isLoading.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
}

// Handle Owner ID MS2 file loader
async function handleOwnerFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  ownerIdStatus.value = { text: "Decrypting...", error: false };

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const { ownerId: extractedId, charName: extractedName } = extractOwnerId(data);

      if (extractedId === 0) {
        ownerIdStatus.value = { text: "No Owner ID found.", error: true };
        return;
      }

      ownerId.value = extractedId;
      if (extractedName) {
        charName.value = extractedName;
      }

      ownerIdStatus.value = { 
        text: `Loaded ID: 0x${extractedId.toString(16).toUpperCase()} (${extractedName})`, 
        error: false 
      };
    } catch (err: any) {
      console.error(err);
      ownerIdStatus.value = { 
        text: err.message || "Decryption failed. Please import a single-note ms2 partition.", 
        error: true 
      };
    }
  };
  reader.readAsArrayBuffer(file);
}

// Get and Set Instrument maps for channel items
function getInstrumentMapping(gmProgram: number, isPercussion: boolean): number {
  return instrumentMappings.get(`${gmProgram}-${isPercussion}`) ?? 0x11;
}

function setInstrumentMapping(gmProgram: number, isPercussion: boolean, e: Event) {
  const val = parseInt((e.target as HTMLSelectElement).value);
  instrumentMappings.set(`${gmProgram}-${isPercussion}`, val);
}

// Get and Set Channel Volume gain sliders
function getChannelVolume(channel: number): number {
  return channelVolumeScales.get(channel) ?? 100;
}

function setChannelVolume(channel: number, e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value);
  channelVolumeScales.set(channel, val);
}

// Apply merge all instruments
function applyMergeAll() {
  if (!parsedMidi.value) return;
  for (const ch of parsedMidi.value.channels) {
    if (!ch.isPercussion) {
      instrumentMappings.set(`${ch.gmProgram}-${ch.isPercussion}`, mergeTarget.value);
    }
  }
}

// Draw the Piano Roll on Canvas
function drawPianoRoll() {
  const canvas = pianoRollCanvas.value;
  if (!canvas || !parsedMidi.value) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fit canvas CSS dimensions
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = rect.width;
  const h = rect.height;

  // Clear background
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, w, h);

  // Gather notes and scale
  const notes = parsedMidi.value.channels.flatMap(c => c.notes);
  if (notes.length === 0) return;

  const transposed = transposeAndClampNotes(notes, transpose.value);
  const pitches = transposed.map(n => n.pitch);
  const minPitch = Math.min(...pitches) - 2;
  const maxPitch = Math.max(...pitches) + 2;
  const pitchRange = Math.max(1, maxPitch - minPitch);

  const maxTime = Math.max(...notes.map(n => n.start + n.dur));

  // Draw grid lines
  ctx.strokeStyle = '#1b1b1e';
  ctx.lineWidth = 0.5;

  // Horizontal note lines
  const horizontalGridCount = 8;
  for (let i = 0; i <= horizontalGridCount; i++) {
    const y = (i / horizontalGridCount) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Vertical time lines
  const verticalGridCount = 12;
  for (let i = 1; i < verticalGridCount; i++) {
    const x = (i / verticalGridCount) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Draw Notes
  ctx.fillStyle = '#d8ad70';
  for (const n of transposed) {
    const x = (n.start / maxTime) * (w - 20) + 10;
    const itemW = Math.max(2.5, (n.dur / maxTime) * (w - 20));
    
    // Reverse Y coordinate (high pitch at the top)
    const y = h - ((n.pitch - minPitch) / pitchRange) * (h - 24) - 12;
    
    // Draw tiny glow box
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#d8ad70';
    
    // Draw rounded note
    ctx.beginPath();
    ctx.roundRect(x, y - 1.5, itemW, 2.5, 1);
    ctx.fill();
  }
  
  // Reset shadow for further draws
  ctx.shadowBlur = 0;

  // Draw glowing golden playback timeline sync cursor
  if (playbackTimeMs.value > 0) {
    const playPercent = Math.min(1.0, playbackTimeMs.value / maxTime);
    const playX = playPercent * (w - 20) + 10;

    ctx.strokeStyle = '#d8ad70';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#d8ad70';

    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, h);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset
  }
}

// Convert core function
function convertFile() {
  if (!parsedMidi.value || !midiFile.value) return;

  try {
    const finalBpm = bpmOverride.value === '' ? parsedMidi.value.bpm : bpmOverride.value;
    
    // Merge channels by assigned BDO instrument
    const mergedNotes = new Map<number, BdoNote[]>();

    for (const chGroup of parsedMidi.value.channels) {
      let chNotes = [...chGroup.notes];

      // 1. Drum processing or Transpose/Clamping
      if (chGroup.isPercussion) {
        chNotes = mapDrumNotes(chNotes);
      } else {
        chNotes = transposeAndClampNotes(chNotes, transpose.value);
      }

      // 2. Velocity gain per channel
      const volumeScale = (channelVolumeScales.get(chGroup.channel) ?? 100) / 100;
      if (volumeScale !== 1.0) {
        chNotes = chNotes.map(n => ({
          ...n,
          vel: Math.max(1, Math.min(127, Math.round(n.vel * volumeScale)))
        }));
      }

      // 3. Global velocity processing modes
      if (velocityMode.value === 'rescale') {
        chNotes = rescaleVelocity(chNotes, rescaleMin.value, rescaleMax.value);
      } else if (velocityMode.value === 'floor') {
        chNotes = floorVelocity(chNotes, floorVal.value);
      } else if (velocityMode.value === 'stepped') {
        chNotes = steppedVelocity(chNotes, steppedBase.value, steppedStep.value);
      } else if (velocityMode.value === 'layered') {
        chNotes = layeredVelocity(chNotes);
      }

      // Resolve mapped instrument ID
      const targetInstId = getInstrumentMapping(chGroup.gmProgram, chGroup.isPercussion);
      if (!mergedNotes.has(targetInstId)) {
        mergedNotes.set(targetInstId, []);
      }
      mergedNotes.get(targetInstId)!.push(...chNotes);
    }

    // 4. Enforce per-instrument limits & track splitting
    const instrumentGroups: BdoInstrumentGroup[] = [];
    let notesDroppedCount = 0;

    for (const [instId, notes] of mergedNotes.entries()) {
      notes.sort((a, b) => a.start - b.start);
      
      let finalNotes = notes;
      if (notes.length > MAX_NOTES_PER_INSTRUMENT) {
        notesDroppedCount += (notes.length - MAX_NOTES_PER_INSTRUMENT);
        finalNotes = notes.slice(0, MAX_NOTES_PER_INSTRUMENT);
      }

      const tracks = splitNotesIntoTracks(finalNotes, MAX_NOTES_PER_TRACK);
      instrumentGroups.push({
        instId,
        tracks
      });
    }

    // Build binary and encrypt
    const effectorSettings = makeTrackSettings(
      reverb.value, 
      delay.value, 
      (chorusFeedback.value > 0 || chorusDepth.value > 0 || chorusFreq.value > 0)
        ? { feedback: chorusFeedback.value, depth: chorusDepth.value, freq: chorusFreq.value }
        : null
    );

    const plaintext = buildBdoBinary(
      finalBpm,
      parsedMidi.value.timeSig,
      instrumentGroups,
      charName.value || 'MIDI',
      ownerId.value,
      effectorSettings
    );

    const encryptedData = encryptBdo(plaintext);

    // Save summary details
    let totalEncodedTracks = 0;
    let totalEncodedNotes = 0;
    for (const group of instrumentGroups) {
      totalEncodedTracks += (group.tracks.length + 1); // +1 empty track
      totalEncodedNotes += group.tracks.reduce((acc, t) => acc + t.length, 0);
    }

    conversionSummary.value = {
      bpm: finalBpm,
      instruments: instrumentGroups.length,
      tracks: totalEncodedTracks,
      total_notes: totalEncodedNotes,
      notes_dropped: notesDroppedCount
    };

    // Download compiled .ms2 file
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    
    // Clean output filename
    let cleanName = fileName.value.replace(/\.[^/.]+$/, ""); // strip extension
    link.href = URL.createObjectURL(blob);
    link.download = `${cleanName}.ms2`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Play premium success confetti!
    if (confetti) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#ffedd4', '#d8ad70', '#b09046', '#e0e0e0']
      });
    }

  } catch (err) {
    console.error(err);
    alert("Critical error compiling composition.");
  }
}
</script>
