<template>
    <div class="bst-root" :style="rootStyles" @click="closeFilterPopover">
        <!-- Toolbar -->
        <div v-if="showToolbar" class="bst-toolbar">
            <div v-if="content.showGlobalSearch" class="bst-search-wrap">
                <svg class="bst-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    v-model="globalSearch"
                    type="text"
                    class="bst-search-input"
                    placeholder="Search all columns..."
                />
                <button v-if="globalSearch" type="button" class="bst-search-clear" @click="globalSearch = ''">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            <div class="bst-toolbar-spacer"></div>
            <div class="bst-toolbar-stats">
                <span class="bst-stat">{{ filteredGroups.length }} <span class="bst-stat-label">groups</span></span>
                <span class="bst-stat-sep">&middot;</span>
                <span class="bst-stat">{{ totalLineItems }} <span class="bst-stat-label">items</span></span>
                <template v-if="selectedCount > 0">
                    <span class="bst-stat-sep">&middot;</span>
                    <span class="bst-stat bst-stat-selected">{{ selectedCount }} <span class="bst-stat-label">selected</span></span>
                </template>
            </div>
        </div>

        <!-- Table scroll wrapper -->
        <div class="bst-table-wrap" ref="tableWrapRef" :style="{ maxHeight: content.tableMaxHeight || '600px' }">
            <table class="bst-table" :class="densityClass">
                <colgroup>
                    <col v-if="selectionEnabled" class="bst-col-checkbox" />
                    <col
                        v-for="col in visibleColumns"
                        :key="'col-' + col._uid"
                        :style="{ width: getColWidth(col) + 'px' }"
                    />
                </colgroup>

                <thead class="bst-thead">
                    <tr class="bst-head-row">
                        <th v-if="selectionEnabled" class="bst-th bst-th-checkbox bst-th-sticky">
                            <input
                                type="checkbox"
                                class="bst-checkbox"
                                :checked="allVisibleSelected"
                                :indeterminate.prop="someVisibleSelected && !allVisibleSelected"
                                @change="toggleSelectAll"
                                title="Select all visible groups"
                            />
                        </th>
                        <th
                            v-for="(col, colIndex) in visibleColumns"
                            :key="'th-' + col._uid"
                            class="bst-th bst-th-sticky"
                            :class="thClasses(col, colIndex)"
                        >
                            <div class="bst-th-inner">
                                <div class="bst-th-content bst-sortable" @click="handleSort(col)">
                                    <span class="bst-th-label">{{ col.title?.trim() || col.field }}</span>
                                    <span v-if="sortState.field === col._sortKey" class="bst-sort-icon bst-sort-active">
                                        <svg v-if="sortState.direction === 'asc'" viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 3l5 6H3z"/></svg>
                                        <svg v-else viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 13l5-6H3z"/></svg>
                                    </span>
                                    <span v-else class="bst-sort-icon bst-sort-hint">
                                        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><path d="M8 4l3 3.5H5z"/><path d="M8 12l3-3.5H5z"/></svg>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    class="bst-col-filter-btn"
                                    :class="{ 'bst-col-filter-btn-active': hasActiveFilter(col) }"
                                    @click.stop="toggleFilterPopover(col)"
                                    title="Filter this column"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                                        <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </button>
                            </div>

                            <!-- Per-column filter popover -->
                            <div
                                v-if="activeFilterCol === col._uid"
                                class="bst-col-filter-popover"
                                @click.stop
                            >
                                <div class="bst-col-filter-input-wrap">
                                    <input
                                        type="text"
                                        class="bst-col-filter-input"
                                        :value="columnFilters[col._filterKey] || ''"
                                        @input="setColumnFilter(col, $event.target.value)"
                                        placeholder="Type to filter..."
                                        ref="filterPopoverInputRef"
                                    />
                                    <button
                                        v-if="hasActiveFilter(col)"
                                        type="button"
                                        class="bst-col-filter-input-clear"
                                        @click="setColumnFilter(col, '')"
                                    >
                                        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><path d="M12.2 3.8a.6.6 0 0 0-.8 0L8 7.2 4.6 3.8a.6.6 0 0 0-.8.8L7.2 8l-3.4 3.4a.6.6 0 0 0 .8.8L8 8.8l3.4 3.4a.6.6 0 0 0 .8-.8L8.8 8l3.4-3.4a.6.6 0 0 0 0-.8z"/></svg>
                                    </button>
                                </div>
                            </div>

                            <div
                                class="bst-resize-handle"
                                @mousedown.prevent="startResize(col, $event)"
                            ></div>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <template v-for="(group, gi) in paginatedGroups" :key="group.headerId">
                        <tr
                            v-for="(item, ii) in group.items"
                            :key="item._stableId"
                            class="bst-row"
                            :class="rowClasses(group, item, ii, gi)"
                            @click="handleRowClick(group, item)"
                            @mouseenter="hoveredGroupId = group.headerId"
                            @mouseleave="hoveredGroupId = null"
                        >
                            <td
                                v-if="selectionEnabled && ii === 0"
                                :rowspan="group.items.length"
                                class="bst-td bst-td-checkbox"
                                :class="mergedCellClasses(group)"
                            >
                                <input
                                    type="checkbox"
                                    class="bst-checkbox"
                                    :checked="isGroupSelected(group)"
                                    @change.stop="toggleGroupSelection(group)"
                                    @click.stop
                                />
                            </td>

                            <template v-for="(col, colIndex) in visibleColumns" :key="col._uid + '-' + item._stableId">
                                <td
                                    v-if="col.source === 'header' && ii === 0"
                                    :rowspan="group.items.length"
                                    class="bst-td bst-td-header"
                                    :class="headerTdClasses(col, group, colIndex)"
                                >
                                    <span class="bst-cell-text">{{ getDisplayOverride(col, group.header) ?? formatCell(group.header[col.field], col) }}</span>
                                </td>

                                <td
                                    v-if="col.source === 'lineitem'"
                                    class="bst-td bst-td-lineitem"
                                    :class="lineItemTdClasses(col, group, item)"
                                >
                                    <template v-if="getLineCellDisplay(col, group, item) !== null">
                                        <span class="bst-cell-text">{{ getLineCellDisplay(col, group, item) }}</span>
                                    </template>
                                    <template v-else>
                                        <img
                                            v-if="col.formatter === 'image' && item[col.field]"
                                            :src="item[col.field]"
                                            class="bst-cell-img"
                                            loading="lazy"
                                        />
                                        <span
                                            v-else-if="col.formatter === 'badge'"
                                            class="bst-badge"
                                            :style="badgeStyle(item[col.field])"
                                        >
                                            {{ formatCell(item[col.field], col) }}
                                        </span>
                                        <span
                                            v-else-if="col.formatter === 'indicator'"
                                            class="bst-indicator-text"
                                            :class="{
                                                'bst-indicator-overbooked': getIndicator(item) === 'overbooked',
                                                'bst-indicator-buffer': getIndicator(item) === 'usingbuffer',
                                            }"
                                        >
                                            {{ item[col.field] || '\u2014' }}
                                        </span>
                                        <span v-else class="bst-cell-text">{{ formatCell(item[col.field], col) }}</span>
                                    </template>
                                </td>
                            </template>
                        </tr>
                    </template>

                    <tr v-if="paginatedGroups.length === 0" class="bst-empty-row">
                        <td :colspan="totalColspan" class="bst-empty-cell">
                            <div class="bst-empty-content">
                                <svg class="bst-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="3" width="20" height="18" rx="2" />
                                    <line x1="2" y1="9" x2="22" y2="9" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                </svg>
                                <span v-if="hasAnyFilter" class="bst-empty-text">No results match your filters</span>
                                <span v-else-if="visibleColumns.length === 0" class="bst-empty-text">Add columns to configure the table</span>
                                <span v-else class="bst-empty-text">No data to display</span>
                                <button v-if="hasAnyFilter" type="button" class="bst-empty-clear-btn" @click="clearFilters">Clear all filters</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="paginationEnabled && totalPages > 1" class="bst-pagination">
            <button type="button" class="bst-page-btn" :disabled="currentPage <= 1" @click="goToPage(1)" title="First page">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M11.7 12.3L7.4 8l4.3-4.3L10.3 2.3 4.6 8l5.7 5.7z"/><path d="M7.7 12.3L3.4 8l4.3-4.3L6.3 2.3.6 8l5.7 5.7z"/></svg>
            </button>
            <button type="button" class="bst-page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)" title="Previous page">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M10.3 12.3L6 8l4.3-4.3L8.9 2.3 3.2 8l5.7 5.7z"/></svg>
            </button>
            <span class="bst-page-label">Page {{ currentPage }} of {{ totalPages }}</span>
            <button type="button" class="bst-page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)" title="Next page">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M5.7 3.7L10 8l-4.3 4.3L7.1 13.7 12.8 8 7.1 2.3z"/></svg>
            </button>
            <button type="button" class="bst-page-btn" :disabled="currentPage >= totalPages" @click="goToPage(totalPages)" title="Last page">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M4.3 3.7L8.6 8l-4.3 4.3L5.7 13.7 11.4 8 5.7 2.3z"/><path d="M8.3 3.7L12.6 8l-4.3 4.3L9.7 13.7 15.4 8 9.7 2.3z"/></svg>
            </button>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

function normalizeStr(v) {
    return v == null ? '' : String(v).toLowerCase().trim();
}

function formatDate(v) {
    if (v == null || v === '') return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function findFieldCI(obj, fieldName) {
    if (obj[fieldName] !== undefined) return obj[fieldName];
    const lower = fieldName.toLowerCase();
    for (const k of Object.keys(obj)) {
        if (k.toLowerCase() === lower) return obj[k];
    }
    return undefined;
}

function stripInternalFields(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith('_')) continue;
        out[k] = v;
    }
    return out;
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

function textColorForBg(bgColor) {
    if (!bgColor || !bgColor.startsWith('#') || bgColor.length < 7) return '#374151';
    return luminance(bgColor) > 0.45 ? '#1e293b' : '#ffffff';
}

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

        const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

        // ═══════════ 1. RESOLVE COLLECTIONS ═══════════

        const headers = computed(() => {
            const raw = props.content?.headerData;
            return (raw ? wwLib.wwUtils.getDataFromCollection(raw) : null) || [];
        });

        const lineItems = computed(() => {
            const raw = props.content?.lineItemData;
            return (raw ? wwLib.wwUtils.getDataFromCollection(raw) : null) || [];
        });

        // ═══════════ 2. RELATIONSHIP KEYS ═══════════

        const hKeyField = computed(() => props.content?.headerKeyField || 'id');
        const liForeignKey = computed(() => props.content?.lineItemForeignKey || 'headerid');

        // ═══════════ 3. STABLE IDS FOR LINE ITEMS ═══════════

        const stableIdCache = new WeakMap();
        let stableIdSeq = 0;

        function getStableId(obj) {
            let id = stableIdCache.get(obj);
            if (id == null) {
                id = '__bst_' + (++stableIdSeq);
                stableIdCache.set(obj, id);
            }
            return id;
        }

        const processedLineItems = computed(() =>
            lineItems.value.map(li => ({ ...li, _stableId: getStableId(li) }))
        );

        // ═══════════ 4. GROUP HEADERS + LINE ITEMS ═══════════

        const EMPTY_SENTINEL = Object.freeze({ _empty: true, _stableId: '__bst_empty' });

        const groups = computed(() => {
            const hKey = hKeyField.value;
            const fk = liForeignKey.value;
            const itemsByHeader = {};

            for (const li of processedLineItems.value) {
                const fkVal = findFieldCI(li, fk);
                const key = fkVal != null ? String(fkVal) : '__none__';
                if (!itemsByHeader[key]) itemsByHeader[key] = [];
                itemsByHeader[key].push(li);
            }

            return headers.value.map(h => {
                const headerId = h[hKey] != null ? String(h[hKey]) : null;
                const items = (headerId ? itemsByHeader[headerId] : null) || [];
                const displayItems = items.length > 0
                    ? items
                    : [{ ...EMPTY_SENTINEL, _stableId: '__bst_empty_' + headerId }];
                return { header: h, headerId, items: displayItems, itemCount: items.length };
            });
        });

        // ═══════════ 5. COLUMNS ═══════════

        const rawColumns = computed(() => {
            const cols = props.content?.columns;
            if (!Array.isArray(cols)) return [];
            return cols.map((c, i) => ({
                ...c,
                _uid: (c.field || 'col') + '_' + (c.source || 'h') + '_' + i,
                _sortKey: (c.source || 'header') + '.' + (c.field || ''),
                _filterKey: (c.source || 'header') + '.' + (c.field || ''),
            }));
        });

        const visibleColumns = computed(() => rawColumns.value.filter(c => c.visible !== false && c.field));

        const selectionEnabled = computed(() => !!props.content?.selectionEnabled);
        const multiSelect = computed(() => !!props.content?.multiSelect);
        const paginationEnabled = computed(() => !!props.content?.paginationEnabled);

        const totalColspan = computed(() => {
            let n = visibleColumns.value.length;
            if (selectionEnabled.value) n++;
            return Math.max(n, 1);
        });

        const densityClass = computed(() => 'bst-density-' + (props.content?.rowDensity || 'normal'));

        const showToolbar = computed(() =>
            props.content?.showGlobalSearch || paginationEnabled.value || headers.value.length > 0
        );

        // ═══════════ 6. COLUMN WIDTHS (resizable) ═══════════

        const columnWidthOverrides = ref({});

        function getColWidth(col) {
            return columnWidthOverrides.value[col._uid] || col.width || 150;
        }

        let resizing = null;
        function startResize(col, event) {
            resizing = { col, startX: event.clientX, startW: getColWidth(col) };
            document.addEventListener('mousemove', onResizeMove);
            document.addEventListener('mouseup', onResizeEnd);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        function onResizeMove(e) {
            if (!resizing) return;
            const diff = e.clientX - resizing.startX;
            const newW = Math.max(40, resizing.startW + diff);
            columnWidthOverrides.value = {
                ...columnWidthOverrides.value,
                [resizing.col._uid]: newW,
            };
        }
        function onResizeEnd() {
            resizing = null;
            document.removeEventListener('mousemove', onResizeMove);
            document.removeEventListener('mouseup', onResizeEnd);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        // ═══════════ 7. SORTING (tri-state: asc → desc → clear) ═══════════

        const sortState = ref({ field: null, direction: null, source: null });

        function handleSort(col) {
            /* wwEditor:start */
            if (props.wwEditorState?.isEditing) return;
            /* wwEditor:end */
            closeFilterPopover();
            const key = col._sortKey;

            if (sortState.value.field !== key) {
                sortState.value = { field: key, direction: 'asc', source: col.source };
            } else if (sortState.value.direction === 'asc') {
                sortState.value = { field: key, direction: 'desc', source: col.source };
            } else {
                sortState.value = { field: null, direction: null, source: null };
            }

            emit('trigger-event', {
                name: 'sortChange',
                event: { value: { field: col.field, direction: sortState.value.direction, source: col.source } },
            });
        }

        function compareCells(a, b) {
            if (a == null && b == null) return 0;
            if (a == null) return 1;
            if (b == null) return -1;
            if (typeof a === 'boolean' || typeof b === 'boolean') return (a === true ? 1 : 0) - (b === true ? 1 : 0);
            const na = Number(a), nb = Number(b);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
            return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
        }

        const sortedGroups = computed(() => {
            const s = sortState.value;
            if (!s.field) return groups.value;
            const parts = s.field.split('.');
            const source = parts[0];
            const field = parts.slice(1).join('.');
            const dir = s.direction === 'desc' ? -1 : 1;

            if (source === 'header') {
                return [...groups.value].sort((a, b) => dir * compareCells(a.header[field], b.header[field]));
            }

            const result = groups.value.map(g => {
                if (g.items.length > 1 && !g.items[0]._empty) {
                    return { ...g, items: [...g.items].sort((a, b) => dir * compareCells(a[field], b[field])) };
                }
                return g;
            });

            result.sort((a, b) => {
                const aFirst = a.items[0]?._empty ? null : a.items[0]?.[field];
                const bFirst = b.items[0]?._empty ? null : b.items[0]?.[field];
                return dir * compareCells(aFirst, bFirst);
            });

            return result;
        });

        // ═══════════ 8. FILTERING (global + per-column popover) ═══════════

        const globalSearch = ref('');
        const columnFilters = ref({});
        const activeFilterCol = ref(null);
        const filterPopoverInputRef = ref(null);

        function toggleFilterPopover(col) {
            if (activeFilterCol.value === col._uid) {
                activeFilterCol.value = null;
            } else {
                activeFilterCol.value = col._uid;
                nextTick(() => {
                    const el = document.querySelector('.bst-col-filter-popover .bst-col-filter-input');
                    if (el) el.focus();
                });
            }
        }

        function closeFilterPopover() {
            activeFilterCol.value = null;
        }

        function setColumnFilter(col, value) {
            columnFilters.value = { ...columnFilters.value, [col._filterKey]: value };
        }

        function hasActiveFilter(col) {
            const v = columnFilters.value[col._filterKey];
            return v != null && v.trim() !== '';
        }

        const hasAnyFilter = computed(() => {
            if (globalSearch.value.trim()) return true;
            return Object.values(columnFilters.value).some(v => v && v.trim());
        });

        function matchesFilter(value, filterStr) {
            if (!filterStr || !filterStr.trim()) return true;
            return normalizeStr(value).includes(normalizeStr(filterStr));
        }

        const filteredGroups = computed(() => {
            let result = sortedGroups.value;
            const gs = normalizeStr(globalSearch.value);
            const colFilts = columnFilters.value;
            const hasColFilters = Object.values(colFilts).some(v => v && v.trim());

            if (!gs && !hasColFilters) return result;

            return result.filter(group => {
                let headerMatchesCol = true;
                let headerMatchesGlobal = false;

                for (const col of rawColumns.value) {
                    if (col.source !== 'header') continue;
                    const val = group.header[col.field];
                    const fk = col._filterKey;
                    if (colFilts[fk] && colFilts[fk].trim()) {
                        if (!matchesFilter(val, colFilts[fk])) { headerMatchesCol = false; break; }
                    }
                    if (gs && normalizeStr(val).includes(gs)) headerMatchesGlobal = true;
                }

                if (!headerMatchesCol) return false;

                const liCols = rawColumns.value.filter(c => c.source === 'lineitem');
                const anyItemMatches = group.items.some(item => {
                    if (item._empty) return false;
                    let itemMatchesCol = true;
                    let itemMatchesGlobal = false;
                    for (const col of liCols) {
                        const val = item[col.field];
                        const fk = col._filterKey;
                        if (colFilts[fk] && colFilts[fk].trim()) {
                            if (!matchesFilter(val, colFilts[fk])) { itemMatchesCol = false; break; }
                        }
                        if (gs && normalizeStr(val).includes(gs)) itemMatchesGlobal = true;
                    }
                    return itemMatchesCol && (!gs || itemMatchesGlobal);
                });

                if (gs) return headerMatchesGlobal || anyItemMatches;
                if (hasColFilters) {
                    const hasLiFilter = liCols.some(c => colFilts[c._filterKey]?.trim());
                    return hasLiFilter ? anyItemMatches : true;
                }
                return true;
            });
        });

        const totalLineItems = computed(() =>
            filteredGroups.value.reduce((sum, g) => sum + g.itemCount, 0)
        );

        // ═══════════ 9. PAGINATION ═══════════

        const currentPage = ref(1);
        const pageSize = computed(() => props.content?.pageSize || 25);

        const totalPages = computed(() => {
            if (!paginationEnabled.value) return 1;
            return Math.max(1, Math.ceil(filteredGroups.value.length / pageSize.value));
        });

        const paginatedGroups = computed(() => {
            if (!paginationEnabled.value) return filteredGroups.value;
            const start = (currentPage.value - 1) * pageSize.value;
            return filteredGroups.value.slice(start, start + pageSize.value);
        });

        watch([globalSearch, columnFilters], () => { currentPage.value = 1; }, { deep: true });

        watch(filteredGroups, () => {
            if (currentPage.value > totalPages.value) currentPage.value = Math.max(1, totalPages.value);
        });

        function goToPage(page) {
            currentPage.value = Math.max(1, Math.min(page, totalPages.value));
        }

        // ═══════════ 10. SELECTION ═══════════

        const selectedIds = ref(new Set());
        const activeGroupId = ref(null);
        const selectedCount = computed(() => selectedIds.value.size);

        function isGroupSelected(group) { return selectedIds.value.has(group.headerId); }
        function isGroupActive(group) { return activeGroupId.value === group.headerId; }

        function toggleGroupSelection(group) {
            /* wwEditor:start */
            if (props.wwEditorState?.isEditing) return;
            /* wwEditor:end */
            const next = new Set(selectedIds.value);
            if (next.has(group.headerId)) {
                next.delete(group.headerId);
            } else {
                if (!multiSelect.value) next.clear();
                next.add(group.headerId);
            }
            selectedIds.value = next;
            emitSelectionChange();
        }

        function toggleSelectAll() {
            /* wwEditor:start */
            if (props.wwEditorState?.isEditing) return;
            /* wwEditor:end */
            if (allVisibleSelected.value) {
                selectedIds.value = new Set();
            } else {
                const next = new Set();
                paginatedGroups.value.forEach(g => { if (g.headerId) next.add(g.headerId); });
                selectedIds.value = next;
            }
            emitSelectionChange();
        }

        const allVisibleSelected = computed(() => {
            const visible = paginatedGroups.value.filter(g => g.headerId);
            return visible.length > 0 && visible.every(g => selectedIds.value.has(g.headerId));
        });

        const someVisibleSelected = computed(() =>
            paginatedGroups.value.some(g => selectedIds.value.has(g.headerId))
        );

        function handleRowClick(group, item) {
            /* wwEditor:start */
            if (props.wwEditorState?.isEditing) return;
            /* wwEditor:end */
            activeGroupId.value = group.headerId;

            emit('trigger-event', {
                name: 'rowClick',
                event: {
                    value: {
                        header: stripInternalFields(group.header),
                        lineItem: item._empty ? null : stripInternalFields(item),
                    },
                },
            });

            emit('trigger-event', {
                name: 'activeHeaderChange',
                event: {
                    value: {
                        header: stripInternalFields(group.header),
                        lineItems: group.items.filter(i => !i._empty).map(stripInternalFields),
                    },
                },
            });
        }

        function emitSelectionChange() {
            const selHeaders = [];
            const selHeaderIds = [];
            const selItems = [];
            const selItemIds = [];

            for (const group of groups.value) {
                if (!selectedIds.value.has(group.headerId)) continue;
                selHeaders.push(stripInternalFields(group.header));
                selHeaderIds.push(group.headerId);
                for (const item of group.items) {
                    if (item._empty) continue;
                    selItems.push(stripInternalFields(item));
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

        // ═══════════ 11. COMPONENT VARIABLES ═══════════

        const selectedHeaderIdsVar = wwLib.wwVariable.useComponentVariable({ uid: props.uid, name: 'Selected Header IDs', type: 'array', defaultValue: [], readonly: true });
        const selectedHeaderObjectsVar = wwLib.wwVariable.useComponentVariable({ uid: props.uid, name: 'Selected Headers', type: 'array', defaultValue: [], readonly: true });
        const selectedLineItemIdsVar = wwLib.wwVariable.useComponentVariable({ uid: props.uid, name: 'Selected Line Item IDs', type: 'array', defaultValue: [], readonly: true });
        const selectedLineItemObjectsVar = wwLib.wwVariable.useComponentVariable({ uid: props.uid, name: 'Selected Line Items', type: 'array', defaultValue: [], readonly: true });
        const activeHeaderVar = wwLib.wwVariable.useComponentVariable({ uid: props.uid, name: 'Active Header', type: 'object', defaultValue: null, readonly: true });

        watch(activeGroupId, (id) => {
            const group = groups.value.find(g => g.headerId === id);
            if (activeHeaderVar) activeHeaderVar.setValue(group ? stripInternalFields(group.header) : null);
        });

        // ═══════════ 12. FORMATTING ═══════════

        function formatCell(value, col) {
            if (value == null || value === '') return '\u2014';
            switch (col.formatter) {
                case 'date': return formatDate(value);
                case 'number': return Number(value).toLocaleString();
                case 'boolean': return value === true || value === 'true' ? 'Yes' : 'No';
                default: return String(value);
            }
        }

        /** When column has displayValueFormula, resolve it with context (header or line item); otherwise return undefined. */
        function getDisplayOverride(col, context) {
            const formula = col?.displayValueFormula;
            if (!formula || (typeof formula === 'object' && formula?.type === 'f' && !formula?.code)) return undefined;
            try {
                const v = resolveMappingFormula(formula, context);
                return v === undefined || v === null ? undefined : v;
            } catch (_) {
                return undefined;
            }
        }

        /** For line cells: override if set, otherwise null (template shows default content). */
        function getLineCellDisplay(col, group, item) {
            const ctx = { ...item, header: group.header };
            const override = getDisplayOverride(col, ctx);
            return override !== undefined ? override : null;
        }

        const statusColorMap = computed(() => props.content?.statusColorMap || {});

        function badgeStyle(value) {
            const bg = statusColorMap.value[value];
            if (bg) return { background: bg, color: textColorForBg(bg) };
            if (value === true || value === 'true') return { background: '#fee2e2', color: '#991b1b' };
            if (value === false || value === 'false') return { background: '#f3f4f6', color: '#374151' };
            return {};
        }

        // ═══════════ 13. CLASSES & STYLES ═══════════

        const tableWrapRef = ref(null);
        const hoveredGroupId = ref(null);

        function isGroupHovered(group) {
            return hoveredGroupId.value != null && hoveredGroupId.value === group.headerId;
        }

        function getIndicator(item) {
            const v = item?.indicator;
            if (!v || typeof v !== 'string') return null;
            const lower = v.trim().toLowerCase();
            if (lower === 'overbooked') return 'overbooked';
            if (lower === 'using buffer') return 'usingbuffer';
            return null;
        }

        function hasGroupOverbooked(group) {
            return group.items.some(item => getIndicator(item) === 'overbooked');
        }

        const rootStyles = computed(() => {
            const s = {
                '--bst-header-bg': props.content?.headerBgColor || '#f8f9fa',
                '--bst-header-text': props.content?.headerTextColor || '#374151',
                '--bst-row-bg': props.content?.rowBgColor || '#ffffff',
                '--bst-row-alt-bg': props.content?.rowAltBgColor || '#fafbfc',
                '--bst-row-hover': props.content?.rowHoverColor || '#eef2ff',
                '--bst-selected-bg': props.content?.selectedRowColor || '#dbeafe',
                '--bst-selected-hover': props.content?.selectedRowHoverColor || '#c7d2fe',
                '--bst-active-bg': props.content?.activeRowColor || '#ede9fe',
                '--bst-border': props.content?.borderColor || '#e5e7eb',
                '--bst-sep': props.content?.groupSeparatorColor || '#d1d5db',
                '--bst-font': props.content?.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                '--bst-font-size': props.content?.fontSize || '13px',
                '--bst-header-fw': props.content?.headerFontWeight || '600',
                '--bst-indicator-bg': props.content?.indicatorBgColor || '#fef2f2',
                '--bst-indicator-hover': props.content?.indicatorHoverColor || '#fde8e8',
            };
            const cp = props.content?.cellPadding;
            if (cp && cp.trim()) s['--bst-cell-padding'] = cp;
            return s;
        });

        function thClasses(col, colIndex) {
            const vis = visibleColumns.value;
            const headerAfterLine = col.source === 'header' && colIndex > 0 && vis[colIndex - 1]?.source === 'lineitem';
            return {
                'bst-th-header-col': col.source === 'header',
                'bst-header-after-line': headerAfterLine,
            };
        }

        function headerTdClasses(col, group, colIndex) {
            const vis = visibleColumns.value;
            const headerAfterLine = col.source === 'header' && colIndex > 0 && vis[colIndex - 1]?.source === 'lineitem';
            const overbooked = hasGroupOverbooked(group);
            return {
                'bst-selected': isGroupSelected(group),
                'bst-active': isGroupActive(group),
                'bst-hovered': isGroupHovered(group),
                'bst-indicator-row': overbooked,
                'bst-header-after-line': headerAfterLine,
            };
        }

        function lineItemTdClasses(col, group, item) {
            const overbooked = hasGroupOverbooked(group);
            return {
                'bst-selected': isGroupSelected(group),
                'bst-active': isGroupActive(group),
                'bst-hovered': isGroupHovered(group),
                'bst-indicator-row': overbooked,
            };
        }

        function mergedCellClasses(group) {
            const overbooked = hasGroupOverbooked(group);
            return {
                'bst-selected': isGroupSelected(group),
                'bst-active': isGroupActive(group),
                'bst-hovered': isGroupHovered(group),
                'bst-indicator-row': overbooked,
            };
        }

        function rowClasses(group, item, ii, gi) {
            const overbooked = hasGroupOverbooked(group);
            return {
                'bst-group-first': ii === 0,
                'bst-group-last': ii === group.items.length - 1,
                'bst-group-alt': gi % 2 === 1,
                'bst-row-selected': isGroupSelected(group),
                'bst-row-active': isGroupActive(group),
                'bst-row-hovered': isGroupHovered(group),
                'bst-row-indicator': overbooked,
                'bst-row-empty': !!item._empty,
            };
        }

        // ═══════════ 14. ACTIONS ═══════════

        function clearSelection() {
            selectedIds.value = new Set();
            activeGroupId.value = null;
            emitSelectionChange();
        }

        function selectAll() {
            const next = new Set();
            filteredGroups.value.forEach(g => { if (g.headerId) next.add(g.headerId); });
            selectedIds.value = next;
            emitSelectionChange();
        }

        function selectHeaders({ ids }) {
            if (!Array.isArray(ids)) return;
            selectedIds.value = new Set(ids.map(String));
            emitSelectionChange();
        }

        function clearFilters() {
            globalSearch.value = '';
            columnFilters.value = {};
            activeFilterCol.value = null;
        }

        // ═══════════ CLEANUP ═══════════

        onBeforeUnmount(() => {
            document.removeEventListener('mousemove', onResizeMove);
            document.removeEventListener('mouseup', onResizeEnd);
        });

        return {
            groups, filteredGroups, paginatedGroups, totalLineItems,
            visibleColumns, totalColspan, densityClass, getColWidth, showToolbar,
            sortState, handleSort,
            globalSearch, columnFilters, activeFilterCol, filterPopoverInputRef,
            toggleFilterPopover, closeFilterPopover, setColumnFilter, hasActiveFilter, hasAnyFilter,
            currentPage, totalPages, paginationEnabled, goToPage,
            selectionEnabled, selectedIds, selectedCount,
            allVisibleSelected, someVisibleSelected,
            isGroupSelected, isGroupActive, toggleGroupSelection, toggleSelectAll, handleRowClick,
            startResize, tableWrapRef,
            formatCell, getDisplayOverride, getLineCellDisplay, badgeStyle, getIndicator, hoveredGroupId,
            rootStyles, thClasses, headerTdClasses, lineItemTdClasses, mergedCellClasses, rowClasses,
            clearSelection, selectAll, selectHeaders, clearFilters,
        };
    },
};
</script>

<style lang="scss" scoped>
$radius: 8px;
$radius-sm: 5px;
$transition: 0.15s ease;

.bst-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    font-family: var(--bst-font);
    font-size: var(--bst-font-size);
    color: #111827;
    background: #fff;
    border: 1px solid var(--bst-border);
    border-radius: $radius;
    overflow: hidden;
}

/* ═══════════ TOOLBAR ═══════════ */
.bst-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--bst-border);
    background: #fff;
    flex-wrap: wrap;
}

.bst-search-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--bst-border);
    border-radius: $radius-sm;
    background: #fff;
    transition: border-color $transition, box-shadow $transition;
    flex: 1;
    max-width: 360px;

    &:focus-within {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
    }
}

.bst-search-icon { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }

.bst-search-input {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font: inherit; font-size: var(--bst-font-size); color: #111827;
    &::placeholder { color: #9ca3af; }
}

.bst-search-clear {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border: none; background: none;
    color: #9ca3af; cursor: pointer; padding: 0; border-radius: 50%;
    transition: color $transition, background $transition;
    svg { width: 14px; height: 14px; }
    &:hover { color: #374151; background: #f3f4f6; }
}

.bst-toolbar-spacer { flex: 1; }

.bst-toolbar-stats {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #6b7280; white-space: nowrap;
}
.bst-stat { font-variant-numeric: tabular-nums; }
.bst-stat-label { font-weight: 400; }
.bst-stat-selected { color: #6366f1; font-weight: 600; }
.bst-stat-sep { color: #d1d5db; }

/* ═══════════ TABLE ═══════════ */
.bst-table-wrap { overflow: auto; position: relative; }

.bst-table {
    width: 100%; min-width: max-content;
    border-collapse: separate; border-spacing: 0; table-layout: fixed;
}

.bst-density-compact .bst-td,
.bst-density-compact .bst-th { padding: 4px 8px; }
.bst-density-normal .bst-td,
.bst-density-normal .bst-th { padding: 8px 12px; }
.bst-density-comfortable .bst-td,
.bst-density-comfortable .bst-th { padding: 12px 16px; }

.bst-root[style*='--bst-cell-padding'] .bst-td,
.bst-root[style*='--bst-cell-padding'] .bst-th { padding: var(--bst-cell-padding); }

/* ═══════════ THEAD ═══════════ */
.bst-thead { position: sticky; top: 0; z-index: 5; }

.bst-th {
    background: var(--bst-header-bg); color: var(--bst-header-text);
    font-weight: var(--bst-header-fw); text-align: left; white-space: nowrap;
    border-bottom: 2px solid var(--bst-border);
    user-select: none; vertical-align: middle; position: relative;
}

.bst-th-sticky { position: sticky; top: 0; z-index: 3; }

.bst-th-checkbox { width: 48px; min-width: 48px; max-width: 48px; text-align: center; }

.bst-th-inner {
    display: flex; align-items: center; gap: 2px;
}

.bst-th-content {
    display: flex; align-items: center; gap: 4px;
    flex: 1; min-width: 0; cursor: pointer;

    &:hover .bst-th-label { color: #111827; }
    &:hover .bst-sort-hint { opacity: 0.7; }
}

.bst-th-label { overflow: hidden; text-overflow: ellipsis; transition: color $transition; }

.bst-sort-icon { display: inline-flex; flex-shrink: 0; }
.bst-sort-active { color: #6366f1; }
.bst-sort-hint { color: #9ca3af; opacity: 0.3; transition: opacity $transition; }

/* ── Per-column filter button ── */
.bst-col-filter-btn {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; flex-shrink: 0;
    border: none; background: transparent; color: #9ca3af;
    border-radius: 4px; cursor: pointer; padding: 0;
    opacity: 0.35;
    transition: opacity $transition, color $transition, background $transition;

    &:hover { opacity: 1; color: #6366f1; background: rgba(99, 102, 241, 0.06); }
}

.bst-col-filter-btn-active {
    opacity: 1;
    color: #6366f1;
    background: #eef2ff;

    &:hover { background: #e0e7ff; }
}

.bst-th:hover .bst-col-filter-btn { opacity: 0.7; }

/* ── Filter popover ── */
.bst-col-filter-popover {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    min-width: 160px;
    background: #fff;
    border: 1px solid var(--bst-border);
    border-top: none;
    border-radius: 0 0 $radius-sm $radius-sm;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    padding: 6px;
    z-index: 10;
}

.bst-col-filter-input-wrap {
    position: relative; display: flex; align-items: center;
}

.bst-col-filter-input {
    width: 100%; height: 28px;
    border: 1px solid var(--bst-border); border-radius: 4px;
    padding: 0 24px 0 8px;
    font: inherit; font-size: 12px; color: #111827; background: #fff; outline: none;
    transition: border-color $transition, box-shadow $transition;

    &::placeholder { color: #9ca3af; }
    &:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.08); }
}

.bst-col-filter-input-clear {
    position: absolute; right: 4px;
    display: flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; border: none;
    background: #e0e7ff; color: #6366f1; border-radius: 50%;
    cursor: pointer; padding: 0;
    transition: background $transition;
    &:hover { background: #c7d2fe; }
}

/* ── Resize handle ── */
.bst-resize-handle {
    position: absolute; top: 0; right: 0; bottom: 0; width: 6px;
    cursor: col-resize; z-index: 4;

    &::after {
        content: ''; position: absolute; right: 0; top: 25%; bottom: 25%;
        width: 2px; background: transparent; border-radius: 1px;
        transition: background $transition;
    }
    &:hover::after { background: #6366f1; }
}

/* ═══════════ TBODY ═══════════ */
.bst-row {
    transition: background $transition;
    background: var(--bst-row-bg);
    cursor: pointer;
}

/* Group hover: all rows in the group light up */
.bst-row-hovered { background: var(--bst-row-hover); }

/* Selected: light blue */
.bst-row-selected { background: var(--bst-selected-bg); }
/* Selected + hovered: slightly darker */
.bst-row-selected.bst-row-hovered { background: var(--bst-selected-hover); }

/* Indicator rows (overbooked / using buffer): light red bg */
.bst-row-indicator:not(.bst-row-selected) { background: var(--bst-indicator-bg); }
/* Indicator + hovered: slightly darker red */
.bst-row-indicator.bst-row-hovered:not(.bst-row-selected) { background: var(--bst-indicator-hover); }
/* Indicator + selected: blue takes priority */
.bst-row-indicator.bst-row-selected { background: var(--bst-selected-bg); }
.bst-row-indicator.bst-row-selected.bst-row-hovered { background: var(--bst-selected-hover); }

.bst-row-active:not(.bst-row-selected) { background: var(--bst-active-bg); }

/* ═══════════ TD ═══════════ */
.bst-td {
    vertical-align: middle; border-bottom: 1px solid var(--bst-border);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 0;
}
.bst-td-checkbox {
    width: 48px; min-width: 48px; max-width: 48px;
    text-align: center; vertical-align: middle; border-bottom: 1px solid var(--bst-border);
}
.bst-td-header {
    background: inherit; font-weight: 500; vertical-align: middle;
    border-right: 1px solid var(--bst-border);
}
.bst-td-lineitem { background: inherit; }

/* Header column to the right of a line column: add left border */
.bst-header-after-line.bst-th,
.bst-header-after-line.bst-td-header {
    border-left: 1px solid var(--bst-border);
}

/* ═══════════ INDICATOR TEXT ═══════════ */
.bst-indicator-text { font-weight: 600; font-size: 12px; }
.bst-indicator-overbooked { color: #dc2626; }
.bst-indicator-buffer { color: #d97706; }

.bst-group-first .bst-td { border-top: 2px solid var(--bst-sep); }
tbody tr:first-child.bst-group-first .bst-td { border-top: none; }

/* ═══════════ CELLS ═══════════ */
.bst-cell-text {
    display: inline-block; overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap; max-width: 100%;
}
.bst-cell-img { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; vertical-align: middle; }
.bst-badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 11px; font-weight: 600; line-height: 1.5; white-space: nowrap;
    background: #f3f4f6; color: #374151;
}
.bst-checkbox { width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer; }

/* ═══════════ EMPTY ═══════════ */
.bst-empty-row td { border: none; }
.bst-empty-cell { padding: 48px 16px !important; text-align: center; }
.bst-empty-content { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; }
.bst-empty-icon { width: 40px; height: 40px; opacity: 0.5; }
.bst-empty-text { font-size: 13px; }
.bst-empty-clear-btn {
    margin-top: 4px; padding: 6px 14px; font: inherit;
    font-size: 12px; font-weight: 600; color: #6366f1;
    background: #eef2ff; border: 1px solid #c7d2fe; border-radius: $radius-sm;
    cursor: pointer; transition: all $transition;
    &:hover { background: #e0e7ff; border-color: #a5b4fc; }
}

/* ═══════════ PAGINATION ═══════════ */
.bst-pagination {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; border-top: 1px solid var(--bst-border); background: #fff;
}
.bst-page-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border: 1px solid var(--bst-border);
    border-radius: $radius-sm; background: #fff; color: #374151;
    cursor: pointer; transition: all $transition;
    &:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    &:disabled { opacity: 0.35; cursor: not-allowed; }
}
.bst-page-label {
    font-size: 12px; color: #6b7280; padding: 0 8px;
    white-space: nowrap; font-variant-numeric: tabular-nums;
}

/* ═══════════ RESPONSIVE ═══════════ */
@media (max-width: 640px) {
    .bst-toolbar { padding: 8px 10px; gap: 8px; }
    .bst-search-wrap { max-width: 100%; }
    .bst-pagination { padding: 8px 10px; }
}

.bst-row-empty .bst-td-lineitem { color: #9ca3af; font-style: italic; }
</style>
