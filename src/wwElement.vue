<template>
    <div class="bst" :style="rootVars" @click="showStatusFilter = false">
        <!-- Search bar -->
        <div class="bst-bar">
            <div class="bst-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="search" type="text" placeholder="Search bookings..." />
                <button v-if="search" class="bst-clear" @click="search = ''">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="bst-stats">
                <span>{{ filteredGroups.length }} bookings</span>
                <span class="bst-dot">&middot;</span>
                <span>{{ totalItems }} items</span>
                <template v-if="selectedIds.size > 0">
                    <span class="bst-dot">&middot;</span>
                    <span class="bst-sel-count">{{ selectedIds.size }} selected</span>
                </template>
            </div>
        </div>

        <!-- Table -->
        <div class="bst-wrap" :style="{ maxHeight: content.tableMaxHeight || '600px' }">
            <table class="bst-table">
                <colgroup>
                    <col v-for="col in columns" :key="col.key" :style="{ width: getColWidth(col) + 'px' }" />
                </colgroup>
                <thead>
                    <tr>
                        <th v-for="(col, ci) in columns" :key="col.key"
                            :class="[col.thClass, { 'bst-sortable': col.sortField }]"
                            @click="col.sortField && toggleSort(col.sortField)"
                        >
                            <!-- Checkbox header -->
                            <template v-if="col.key === 'checkbox'">
                                <input
                                    type="checkbox"
                                    :checked="allSelected"
                                    :indeterminate.prop="someSelected && !allSelected"
                                    @change="toggleSelectAll"
                                />
                            </template>
                            <template v-else-if="col.label">
                                {{ col.label }}
                                <span v-if="col.sortField" class="bst-sort-icon">{{ sortIcon(col.sortField) }}</span>
                            </template>

                            <!-- Status filter button -->
                            <button
                                v-if="col.key === 'status'"
                                class="bst-filter-btn"
                                :class="{ 'bst-filter-btn-active': hasStatusFilter }"
                                @click.stop="showStatusFilter = !showStatusFilter"
                                title="Filter by status"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                            </button>

                            <!-- Resize handle -->
                            <span
                                v-if="col.resizable !== false"
                                class="bst-resize-handle"
                                @mousedown.stop.prevent="startResize(col, $event)"
                            ></span>

                            <!-- Status filter dropdown -->
                            <div v-if="col.key === 'status' && showStatusFilter" class="bst-filter-drop" @click.stop>
                                <label v-for="s in STATUS_OPTIONS" :key="s" class="bst-filter-opt">
                                    <input type="checkbox" :checked="isStatusVisible(s)" @change="toggleStatusFilter(s)" />
                                    <span class="bst-badge" :style="badgeStyle(s)">{{ s }}</span>
                                </label>
                                <div class="bst-filter-actions">
                                    <button @click="clearStatusFilter">Clear</button>
                                </div>
                            </div>
                        </th>
                    </tr>
                </thead>

                <tbody v-if="filteredGroups.length === 0">
                    <tr class="bst-empty-row">
                        <td :colspan="columns.length">
                            <div class="bst-empty">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                <span v-if="search">No results match "{{ search }}"</span>
                                <span v-else>No bookings to display</span>
                                <button v-if="search" class="bst-empty-btn" @click="search = ''">Clear search</button>
                            </div>
                        </td>
                    </tr>
                </tbody>

                <template v-for="(g, gi) in filteredGroups" :key="g.headerId">
                    <tbody
                        class="bst-group"
                        :class="{
                            'bst-group-alt': gi % 2 === 1,
                            'bst-group-checked': isSelected(g.headerId),
                        }"
                    >
                        <tr
                            v-for="(item, ii) in g.displayItems"
                            :key="item.id || ii"
                            class="bst-row"
                            :class="{ 'bst-row-first': ii === 0 }"
                            @click="handleRowClick(g, item)"
                        >
                            <!-- Header-level: checkbox -->
                            <td v-if="ii === 0" :rowspan="g.displayItems.length" class="bst-chk-col bst-merged">
                                <input type="checkbox" :checked="isSelected(g.headerId)" @click.stop="toggleSelect(g)" />
                            </td>

                            <!-- Header-level: BN -->
                            <td v-if="ii === 0" :rowspan="g.displayItems.length" class="bst-bn bst-merged">
                                {{ g.header.bookingnumber }}
                            </td>

                            <!-- Header-level: PIC -->
                            <td v-if="ii === 0" :rowspan="g.displayItems.length" class="bst-merged">
                                {{ picName(g.header.pic_id) }}
                            </td>

                            <!-- Header-level: Title -->
                            <td v-if="ii === 0" :rowspan="g.displayItems.length" class="bst-title bst-merged">
                                {{ g.header.bookingtitle || '\u2014' }}
                            </td>

                            <!-- Line-item: Image -->
                            <td class="bst-img-col">
                                <img
                                    v-if="!item._empty && skuImage(item.sku)"
                                    :src="skuImage(item.sku)"
                                    class="bst-thumb"
                                    loading="lazy"
                                />
                                <span v-else-if="!item._empty" class="bst-no-img">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                                </span>
                            </td>

                            <!-- Line-item: SKU -->
                            <td :class="{ 'bst-muted': item._empty }">
                                {{ item._empty ? '\u2014' : item.sku || '\u2014' }}
                            </td>

                            <!-- Line-item: Qty -->
                            <td class="bst-num-col" :class="{ 'bst-muted': item._empty }">
                                {{ item._empty ? '' : (item.quantity ?? '\u2014') }}
                            </td>

                            <!-- Line-item: Status -->
                            <td class="bst-before-merged">
                                <span v-if="!item._empty && item.status" class="bst-badge" :style="badgeStyle(item.status)">
                                    {{ item.status }}
                                </span>
                                <span v-else-if="!item._empty" class="bst-muted">&mdash;</span>
                            </td>

                            <!-- Header-level: Updated -->
                            <td v-if="ii === 0" :rowspan="g.displayItems.length" class="bst-date bst-merged">
                                {{ formatDate(g.header.created_at) }}
                            </td>

                            <!-- Line-item: Indicator -->
                            <td class="bst-after-merged">
                                <span v-if="!item._empty && item.indicator" class="bst-indicator" :class="indicatorClass(item.indicator)">
                                    {{ item.indicator }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </table>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

function formatDate(v) {
    if (v == null || v === '') return '\u2014';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function normalize(v) {
    return v == null ? '' : String(v).toLowerCase().trim();
}

function luminance(hex) {
    const rgb = hex.replace('#', '').match(/.{2}/g);
    if (!rgb || rgb.length < 3) return 1;
    const [r, g, b] = rgb.map(c => {
        const v = parseInt(c, 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function textForBg(bg) {
    if (!bg || !bg.startsWith('#') || bg.length < 7) return '#374151';
    return luminance(bg) > 0.45 ? '#1e293b' : '#ffffff';
}

const STATUS_COLORS = {
    'Booked':                   { bg: '#dbeafe', color: '#1e40af' },
    'Issue Raised':             { bg: '#fee2e2', color: '#991b1b' },
    'Processing':               { bg: '#fef9c3', color: '#854d0e' },
    'Delivered to Production':  { bg: '#f3e8ff', color: '#6b21a8' },
    'Delivered to Client':      { bg: '#dcfce7', color: '#166534' },
    'Released':                 { bg: '#f3f4f6', color: '#6b7280' },
};

const DEFAULT_COLUMNS = [
    { key: 'checkbox', label: '',          defaultWidth: 36,  resizable: false, thClass: 'bst-chk-col' },
    { key: 'bn',       label: 'BN',        defaultWidth: 100, sortField: 'bookingnumber' },
    { key: 'pic',      label: 'PIC',       defaultWidth: 120, sortField: 'pic' },
    { key: 'title',    label: 'Title',     defaultWidth: 180, sortField: 'bookingtitle' },
    { key: 'image',    label: '',          defaultWidth: 44,  resizable: false, thClass: 'bst-img-col' },
    { key: 'sku',      label: 'SKU',       defaultWidth: 160, sortField: 'sku' },
    { key: 'qty',      label: 'Qty',       defaultWidth: 55,  sortField: 'quantity', thClass: 'bst-num-col' },
    { key: 'status',   label: 'Status',    defaultWidth: 120, sortField: 'status' },
    { key: 'updated',  label: 'Updated',   defaultWidth: 110, sortField: 'created_at' },
    { key: 'indicator',label: 'Indicator', defaultWidth: 100 },
];

export default {
    props: {
        content: { type: Object, required: true },
        uid: { type: String, required: true },
        /* wwEditor:start */
        wwEditorState: { type: Object, required: true },
        /* wwEditor:end */
    },
    emits: ['trigger-event'],
    setup(props, { emit }) {

        // ── Safe data resolver ──
        function getData(binding) {
            try {
                return wwLib.wwUtils.getDataFromCollection(binding) || [];
            } catch (_) {
                return [];
            }
        }

        const mounted = ref(false);
        onMounted(() => nextTick(() => { mounted.value = true; }));

        // ── Columns with configurable defaults ──

        const columns = computed(() => {
            const overrides = props.content?.columnWidths || {};
            return DEFAULT_COLUMNS.map(c => ({
                ...c,
                defaultWidth: overrides[c.key] || c.defaultWidth,
            }));
        });

        // ── Column resize ──

        const WIDTHS_KEY = 'bst_widths_' + props.uid;
        function loadWidths() {
            try { return JSON.parse(localStorage.getItem(WIDTHS_KEY) || '{}'); } catch { return {}; }
        }
        function saveWidths(m) {
            try { localStorage.setItem(WIDTHS_KEY, JSON.stringify(m)); } catch { /* */ }
        }

        const widthOverrides = ref(loadWidths());

        function getColWidth(col) {
            return widthOverrides.value[col.key] || col.defaultWidth;
        }

        let resizing = null;

        function startResize(col, e) {
            resizing = { key: col.key, startX: e.clientX, startW: getColWidth(col) };
            document.addEventListener('mousemove', onResizeMove);
            document.addEventListener('mouseup', onResizeEnd);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        function onResizeMove(e) {
            if (!resizing) return;
            const newW = Math.max(30, resizing.startW + (e.clientX - resizing.startX));
            widthOverrides.value = { ...widthOverrides.value, [resizing.key]: newW };
        }

        function onResizeEnd() {
            if (resizing) saveWidths(widthOverrides.value);
            resizing = null;
            document.removeEventListener('mousemove', onResizeMove);
            document.removeEventListener('mouseup', onResizeEnd);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        onBeforeUnmount(() => {
            document.removeEventListener('mousemove', onResizeMove);
            document.removeEventListener('mouseup', onResizeEnd);
        });

        // ── Data sources ──

        const headers = computed(() => {
            void mounted.value;
            const raw = props.content?.headerData;
            return raw ? getData(raw) : [];
        });

        const lineItems = computed(() => {
            void mounted.value;
            const raw = props.content?.lineItemData;
            return raw ? getData(raw) : [];
        });

        const picData = computed(() => {
            void mounted.value;
            const raw = props.content?.picReference;
            return raw ? getData(raw) : [];
        });

        const skuData = computed(() => {
            void mounted.value;
            const raw = props.content?.skuReference;
            return raw ? getData(raw) : [];
        });

        // ── Lookup maps ──

        const picMap = computed(() => {
            const m = {};
            for (const p of picData.value) {
                if (p.id) m[p.id] = p.name || p.mastername || String(p.id).slice(0, 8);
            }
            return m;
        });

        const skuImageMap = computed(() => {
            const m = {};
            for (const s of skuData.value) {
                if (s.sku && s.imagelink) m[s.sku] = s.imagelink;
            }
            return m;
        });

        function picName(id) {
            if (!id) return '\u2014';
            return picMap.value[id] || String(id).slice(0, 8);
        }

        function skuImage(sku) {
            return sku ? skuImageMap.value[sku] || null : null;
        }

        // ── Group headers + line items ──

        const EMPTY = Object.freeze({ _empty: true });

        const groups = computed(() => {
            const byHeader = {};
            for (const li of lineItems.value) {
                const hid = li.headerid != null ? String(li.headerid) : '__none__';
                if (!byHeader[hid]) byHeader[hid] = [];
                byHeader[hid].push(li);
            }

            return headers.value.map(h => {
                const hid = h.id != null ? String(h.id) : null;
                const items = (hid ? byHeader[hid] : null) || [];
                return {
                    header: h,
                    headerId: hid,
                    items,
                    displayItems: items.length > 0 ? items : [EMPTY],
                    itemCount: items.length,
                };
            });
        });

        // ── Sorting ──

        const sortField = ref(null);
        const sortDir = ref(null);

        function toggleSort(field) {
            if (sortField.value !== field) {
                sortField.value = field;
                sortDir.value = 'asc';
            } else if (sortDir.value === 'asc') {
                sortDir.value = 'desc';
            } else {
                sortField.value = null;
                sortDir.value = null;
            }
        }

        function sortIcon(field) {
            if (sortField.value !== field) return '';
            return sortDir.value === 'asc' ? '\u25B2' : '\u25BC';
        }

        function cmp(a, b) {
            if (a == null && b == null) return 0;
            if (a == null) return 1;
            if (b == null) return -1;
            const na = Number(a), nb = Number(b);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
            return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
        }

        const HEADER_FIELDS = ['bookingnumber', 'bookingtitle', 'created_at', 'pic'];

        const sortedGroups = computed(() => {
            if (!sortField.value) return groups.value;
            const f = sortField.value;
            const dir = sortDir.value === 'desc' ? -1 : 1;

            if (HEADER_FIELDS.includes(f)) {
                return [...groups.value].sort((a, b) => {
                    let va, vb;
                    if (f === 'pic') {
                        va = picName(a.header.pic_id);
                        vb = picName(b.header.pic_id);
                    } else {
                        va = a.header[f];
                        vb = b.header[f];
                    }
                    return dir * cmp(va, vb);
                });
            }

            return [...groups.value].sort((a, b) => {
                const aFirst = a.items[0]?.[f];
                const bFirst = b.items[0]?.[f];
                return dir * cmp(aFirst, bFirst);
            });
        });

        // ── Status filter ──

        const STATUS_OPTIONS = ['Released', 'Issue Raised', 'Booked', 'Processing', 'Delivered to Production', 'Delivered to Client'];
        const showStatusFilter = ref(false);
        const statusFilter = ref(new Set()); // empty = show all

        const hasStatusFilter = computed(() => statusFilter.value.size > 0);

        function isStatusVisible(s) {
            return statusFilter.value.size === 0 || statusFilter.value.has(s);
        }

        function toggleStatusFilter(s) {
            const next = new Set(statusFilter.value);
            if (next.has(s)) {
                next.delete(s);
            } else {
                next.add(s);
            }
            statusFilter.value = next;
        }

        function clearStatusFilter() {
            statusFilter.value = new Set();
            showStatusFilter.value = false;
        }

        // ── Search ──

        const search = ref('');

        const filteredGroups = computed(() => {
            let result = sortedGroups.value;

            // Status filter: keep groups that have at least one line item matching a checked status
            if (statusFilter.value.size > 0) {
                const allowed = statusFilter.value;
                result = result.filter(g => {
                    if (g.itemCount === 0) return false;
                    return g.items.some(li => allowed.has(li.status));
                });
            }

            // Text search
            const q = normalize(search.value);
            if (!q) return result;

            return result.filter(g => {
                const h = g.header;
                if (normalize(h.bookingnumber).includes(q)) return true;
                if (normalize(h.bookingtitle).includes(q)) return true;
                if (normalize(picName(h.pic_id)).includes(q)) return true;
                if (normalize(h.status).includes(q)) return true;
                return g.items.some(li =>
                    normalize(li.sku).includes(q) ||
                    normalize(li.status).includes(q) ||
                    normalize(li.indicator).includes(q)
                );
            });
        });

        const totalItems = computed(() =>
            filteredGroups.value.reduce((sum, g) => sum + g.itemCount, 0)
        );

        // ── Selection ──

        const selectedIds = ref(new Set());
        const activeId = ref(null);

        function isSelected(hid) { return selectedIds.value.has(hid); }

        function toggleSelect(g) {
            const next = new Set(selectedIds.value);
            if (next.has(g.headerId)) {
                next.delete(g.headerId);
            } else {
                next.add(g.headerId);
            }
            selectedIds.value = next;
            emitSelection();
        }

        function toggleSelectAll() {
            if (allSelected.value) {
                selectedIds.value = new Set();
            } else {
                const next = new Set();
                filteredGroups.value.forEach(g => { if (g.headerId) next.add(g.headerId); });
                selectedIds.value = next;
            }
            emitSelection();
        }

        const allSelected = computed(() => {
            const visible = filteredGroups.value.filter(g => g.headerId);
            return visible.length > 0 && visible.every(g => selectedIds.value.has(g.headerId));
        });

        const someSelected = computed(() =>
            filteredGroups.value.some(g => selectedIds.value.has(g.headerId))
        );

        function handleRowClick(g, item) {
            /* wwEditor:start */
            if (props.wwEditorState?.isEditing) return;
            /* wwEditor:end */
            activeId.value = g.headerId;

            emit('trigger-event', {
                name: 'rowClick',
                event: { value: { header: g.header, lineItem: item._empty ? null : item } },
            });

            emit('trigger-event', {
                name: 'activeHeaderChange',
                event: { value: { header: g.header, lineItems: g.items } },
            });

            if (activeHeaderVar) activeHeaderVar.setValue(g.header);
        }

        function emitSelection() {
            const selHeaders = [];
            const selHeaderIds = [];
            const selItems = [];
            const selItemIds = [];

            for (const g of groups.value) {
                if (!selectedIds.value.has(g.headerId)) continue;
                selHeaders.push(g.header);
                selHeaderIds.push(g.headerId);
                for (const item of g.items) {
                    selItems.push(item);
                    if (item.id != null) selItemIds.push(item.id);
                }
            }

            emit('trigger-event', {
                name: 'selectionChange',
                event: { value: { selectedHeaderIds: selHeaderIds, selectedHeaders: selHeaders, selectedLineItemIds: selItemIds, selectedLineItems: selItems } },
            });

            if (selectedHeaderIdsVar) selectedHeaderIdsVar.setValue(selHeaderIds);
            if (selectedHeaderObjectsVar) selectedHeaderObjectsVar.setValue(selHeaders);
            if (selectedLineItemIdsVar) selectedLineItemIdsVar.setValue(selItemIds);
            if (selectedLineItemObjectsVar) selectedLineItemObjectsVar.setValue(selItems);
        }

        watch(groups, () => emitSelection(), { deep: true });

        // ── Status & Indicator styling ──

        const statusColorMap = computed(() => props.content?.statusColorMap || {});

        function badgeStyle(status) {
            const custom = statusColorMap.value[status];
            if (custom) return { background: custom, color: textForBg(custom) };
            const def = STATUS_COLORS[status];
            if (def) return { background: def.bg, color: def.color };
            return { background: '#f3f4f6', color: '#374151' };
        }

        function indicatorClass(indicator) {
            if (!indicator) return '';
            const lower = indicator.trim().toLowerCase();
            if (lower === 'overbooked') return 'bst-ind-over';
            if (lower === 'using buffer') return 'bst-ind-buffer';
            return '';
        }

        // ── Root CSS vars ──

        const rootVars = computed(() => ({
            '--bst-header-bg': props.content?.headerBgColor || '#f8f9fa',
            '--bst-header-text': props.content?.headerTextColor || '#374151',
            '--bst-row-bg': props.content?.rowBgColor || '#ffffff',
            '--bst-row-alt': props.content?.rowAltBgColor || '#fafbfc',
            '--bst-row-hover': props.content?.rowHoverColor || '#f0f7ff',
            '--bst-checked-bg': props.content?.selectedRowColor || '#eff6ff',
            '--bst-border': props.content?.borderColor || '#e5e7eb',
            '--bst-font': props.content?.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            '--bst-fs': props.content?.fontSize || '13px',
        }));

        // ── Component variables ──

        function safeVar(opts) {
            try { return wwLib.wwVariable.useComponentVariable(opts); } catch (_) { return null; }
        }

        const selectedHeaderIdsVar = safeVar({ uid: props.uid, name: 'Selected Header IDs', type: 'array', defaultValue: [], readonly: true });
        const selectedHeaderObjectsVar = safeVar({ uid: props.uid, name: 'Selected Headers', type: 'array', defaultValue: [], readonly: true });
        const selectedLineItemIdsVar = safeVar({ uid: props.uid, name: 'Selected Line Item IDs', type: 'array', defaultValue: [], readonly: true });
        const selectedLineItemObjectsVar = safeVar({ uid: props.uid, name: 'Selected Line Items', type: 'array', defaultValue: [], readonly: true });
        const activeHeaderVar = safeVar({ uid: props.uid, name: 'Active Header', type: 'object', defaultValue: null, readonly: true });

        // ── Actions ──

        function clearSelection() {
            selectedIds.value = new Set();
            activeId.value = null;
            emitSelection();
        }

        function selectAll() {
            const next = new Set();
            filteredGroups.value.forEach(g => { if (g.headerId) next.add(g.headerId); });
            selectedIds.value = next;
            emitSelection();
        }

        function selectHeaders({ ids }) {
            if (!Array.isArray(ids)) return;
            selectedIds.value = new Set(ids.map(String));
            emitSelection();
        }

        return {
            columns, getColWidth, startResize,
            filteredGroups, totalItems,
            search,
            STATUS_OPTIONS, showStatusFilter, statusFilter, hasStatusFilter,
            isStatusVisible, toggleStatusFilter, clearStatusFilter,
            toggleSort, sortIcon,
            selectedIds, activeId, isSelected,
            toggleSelect, toggleSelectAll, allSelected, someSelected,
            handleRowClick,
            picName, skuImage, formatDate, badgeStyle, indicatorClass,
            rootVars,
            clearSelection, selectAll, selectHeaders,
        };
    },
};
</script>

<style lang="scss" scoped>
.bst {
    display: flex;
    flex-direction: column;
    width: 100%;
    font-family: var(--bst-font);
    font-size: var(--bst-fs);
    color: #111827;
    background: #fff;
    border: 1px solid var(--bst-border);
    border-radius: 8px;
    overflow: hidden;
}

/* ── Search bar ── */
.bst-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--bst-border);
    background: #fff;
}

.bst-search {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 8px;
    border: 1px solid var(--bst-border);
    border-radius: 6px;
    background: #fff;
    flex: 1;
    max-width: 320px;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    svg { width: 14px; height: 14px; color: #9ca3af; flex-shrink: 0; }

    input {
        flex: 1; min-width: 0; border: none; outline: none; background: transparent;
        font: inherit; font-size: var(--bst-fs); color: #111827;
        &::placeholder { color: #9ca3af; }
    }
}

.bst-clear {
    display: flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border: none; background: none;
    color: #9ca3af; cursor: pointer; padding: 0; border-radius: 50%;
    svg { width: 12px; height: 12px; }
    &:hover { color: #374151; background: #f3f4f6; }
}

.bst-stats {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #6b7280; white-space: nowrap; margin-left: auto;
}
.bst-dot { color: #d1d5db; }
.bst-sel-count { color: #3b82f6; font-weight: 600; }

/* ── Table ── */
.bst-wrap { overflow: auto; position: relative; }

.bst-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

/* ── Header ── */
thead {
    position: sticky;
    top: 0;
    z-index: 2;

    tr { background: var(--bst-header-bg); }

    th {
        padding: 6px 10px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: var(--bst-header-text);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-bottom: 1px solid var(--bst-border);
        white-space: nowrap;
        user-select: none;
        position: relative;
    }
}

.bst-sortable {
    cursor: pointer;
    &:hover { color: #111827; }
}

.bst-sort-icon {
    font-size: 9px;
    margin-left: 2px;
    opacity: 0.7;
}

/* ── Status filter ── */
.bst-filter-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    border-radius: 3px;
    margin-left: 4px;
    vertical-align: middle;
    transition: color 0.1s, background 0.1s;

    svg { width: 12px; height: 12px; }

    &:hover { color: #374151; background: #e5e7eb; }
}

.bst-filter-btn-active {
    color: #3b82f6 !important;
    &:hover { color: #2563eb !important; }
}

.bst-filter-drop {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    min-width: 200px;
    background: #fff;
    border: 1px solid var(--bst-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 6px 0;
    margin-top: 2px;
}

.bst-filter-opt {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: #374151;
    transition: background 0.1s;

    &:hover { background: #f9fafb; }

    input[type="checkbox"] {
        width: 13px;
        height: 13px;
        flex-shrink: 0;
    }
}

.bst-filter-actions {
    border-top: 1px solid #f3f4f6;
    padding: 4px 12px;
    margin-top: 2px;

    button {
        border: none;
        background: none;
        color: #6b7280;
        font-size: 11px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 3px;
        &:hover { color: #111827; background: #f3f4f6; }
    }
}

/* ── Resize handle ── */
.bst-resize-handle {
    position: absolute;
    top: 0;
    right: -2px;
    width: 5px;
    height: 100%;
    cursor: col-resize;
    z-index: 3;

    &:hover,
    &:active {
        background: rgba(59, 130, 246, 0.3);
    }
}

/* ── Column classes ── */
.bst-chk-col { width: 36px; text-align: center !important; }
.bst-img-col { padding: 3px 6px !important; }
.bst-num-col { text-align: right !important; }
.bst-bn { font-weight: 600; white-space: nowrap; }
.bst-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bst-date { white-space: nowrap; font-size: 11px; color: #6b7280; }

/* ── Rows ── */
.bst-group {
    & + .bst-group { border-top: 1px solid var(--bst-border); }
}

.bst-group-alt tr { background: var(--bst-row-alt); }
.bst-group-alt:hover tr { background: var(--bst-row-hover); }

.bst-group-checked tr { background: var(--bst-checked-bg); }
.bst-group-checked:hover tr { background: var(--bst-row-hover); }

.bst-row {
    background: var(--bst-row-bg);
    cursor: pointer;
    transition: background 0.1s;

    td {
        padding: 5px 10px;
        border-bottom: none;
        font-size: var(--bst-fs);
        vertical-align: middle;
    }
}

.bst-group:hover tr {
    background: var(--bst-row-hover);
}

.bst-row:not(.bst-row-first) td {
    border-top: 1px solid #f3f4f6;
}

.bst-merged {
    border-right: 1px solid #f0f0f0;
    border-left: 1px solid #f0f0f0;
}

.bst-before-merged {
    border-right: 1px solid #f0f0f0;
}

.bst-after-merged {
    border-left: 1px solid #f0f0f0;
}

.bst-muted { color: #d1d5db; }

/* ── SKU thumbnail ── */
.bst-thumb {
    width: 28px;
    height: 28px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
}

.bst-no-img {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    svg { width: 18px; height: 18px; color: #d1d5db; }
}

/* ── Badges ── */
.bst-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    line-height: 1.5;
}

/* ── Indicators ── */
.bst-indicator {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    white-space: nowrap;
}

.bst-ind-over { color: #dc2626; }
.bst-ind-buffer { color: #ea580c; }

/* ── Empty state ── */
.bst-empty-row td { border: none; }

.bst-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 40px 16px;
    color: #9ca3af;

    svg { width: 32px; height: 32px; opacity: 0.5; }
    span { font-size: 13px; }
}

.bst-empty-btn {
    margin-top: 4px;
    padding: 4px 12px;
    border: 1px solid var(--bst-border);
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 12px;
    cursor: pointer;
    &:hover { background: #f9fafb; }
}

/* ── Checkbox ── */
input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: #3b82f6;
}
</style>
