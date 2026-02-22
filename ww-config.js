export default {
    editor: {
        label: { en: 'Booking Sheet Table' },
        icon: 'data',
        customSettingsPropertiesOrder: [
            {
                label: 'Data Sources',
                isCollapsible: true,
                properties: ['headerData', 'lineItemData', 'referenceData'],
            },
            {
                label: 'Relationship Mapping',
                isCollapsible: true,
                properties: [
                    'headerKeyField',
                    'lineItemForeignKey',
                    'referenceKeyField',
                    'lineItemRefJoinField',
                    'caseInsensitiveJoin',
                ],
            },
            {
                label: 'Columns',
                isCollapsible: true,
                properties: ['columns'],
            },
            {
                label: 'Display',
                isCollapsible: true,
                properties: ['showFilterRow', 'showGlobalSearch', 'tableMaxHeight'],
            },
            {
                label: 'Pagination',
                isCollapsible: true,
                properties: ['paginationEnabled', 'pageSize'],
            },
            {
                label: 'Selection',
                isCollapsible: true,
                properties: ['selectionEnabled', 'multiSelect'],
            },
        ],
        customStylePropertiesOrder: [
            {
                label: 'Colors',
                isCollapsible: true,
                properties: [
                    'headerBgColor',
                    'headerTextColor',
                    'rowBgColor',
                    'rowAltBgColor',
                    'rowHoverColor',
                    'selectedRowColor',
                    'activeRowColor',
                    'borderColor',
                    'groupSeparatorColor',
                ],
            },
            {
                label: 'Typography',
                isCollapsible: true,
                properties: ['fontFamily', 'fontSize', 'headerFontWeight'],
            },
            {
                label: 'Density',
                isCollapsible: true,
                properties: ['rowDensity', 'cellPadding'],
            },
            {
                label: 'Conditional Styling',
                isCollapsible: true,
                properties: ['overbookedHighlight', 'statusColorMap'],
            },
        ],
    },
    triggerEvents: [
        {
            name: 'rowClick',
            label: { en: 'On Row Click' },
            event: {
                value: {
                    header: { id: null, bookingnumber: null, bookingtitle: null, created_at: null },
                    lineItem: { id: null, sku: null, quantity: null, status: null },
                },
            },
            default: true,
        },
        {
            name: 'selectionChange',
            label: { en: 'On Selection Change' },
            event: {
                value: {
                    selectedHeaderIds: [],
                    selectedHeaders: [],
                    selectedLineItemIds: [],
                    selectedLineItems: [],
                },
            },
            default: false,
        },
        {
            name: 'activeHeaderChange',
            label: { en: 'On Active Header Change' },
            event: {
                value: {
                    header: null,
                    lineItems: [],
                },
            },
            default: false,
        },
        {
            name: 'sortChange',
            label: { en: 'On Sort Change' },
            event: { value: { field: null, direction: null, source: null } },
            default: false,
        },
    ],
    actions: [
        { action: 'clearSelection', label: { en: 'Clear selection' } },
        { action: 'selectAll', label: { en: 'Select all' } },
        {
            action: 'selectHeaders',
            label: { en: 'Select headers by IDs' },
            args: [{ name: 'ids', type: 'array' }],
        },
        {
            action: 'goToPage',
            label: { en: 'Go to page' },
            args: [{ name: 'page', type: 'number' }],
        },
        { action: 'clearFilters', label: { en: 'Clear all filters' } },
    ],
    properties: {
        /* ── Data Sources ── */
        headerData: {
            label: { en: 'Header Data' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Array of header objects (e.g. bookings). Must contain a unique key field.',
            },
            /* wwEditor:end */
        },
        lineItemData: {
            label: { en: 'Line Items Data' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Array of line item objects. Must contain a foreign key linking to Header Data.',
            },
            /* wwEditor:end */
        },
        referenceData: {
            label: { en: 'Reference Data (optional)' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Optional reference array (e.g. inventory) to enrich line items with image, model, color, etc.',
            },
            /* wwEditor:end */
        },

        /* ── Relationship Mapping ── */
        headerKeyField: {
            label: { en: 'Header key field' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'id',
            options: { placeholder: 'id' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'Primary key field in Header Data (default: id)' },
            /* wwEditor:end */
        },
        lineItemForeignKey: {
            label: { en: 'Line item foreign key' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'headerid',
            options: { placeholder: 'headerid' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'Foreign key in Line Items Data referencing the header (default: headerid)' },
            /* wwEditor:end */
        },
        referenceKeyField: {
            label: { en: 'Reference key field' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'sku',
            options: { placeholder: 'sku or SKU' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'Key field in Reference Data to match line items (default: sku). Case-insensitive lookup supported.' },
            /* wwEditor:end */
        },
        lineItemRefJoinField: {
            label: { en: 'Line item join field (to reference)' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'sku',
            options: { placeholder: 'sku' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'Field in Line Items Data used to join with Reference Data (default: sku)' },
            /* wwEditor:end */
        },
        caseInsensitiveJoin: {
            label: { en: 'Case-insensitive reference join' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            /* wwEditor:start */
            propertyHelp: { tooltip: 'Match reference keys case-insensitively (handles SKU vs sku)' },
            /* wwEditor:end */
        },

        /* ── Columns ── */
        columns: {
            label: { en: 'Table Columns' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: [
                { source: 'header', field: 'bookingnumber', label: 'Booking #', width: 130, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'text' },
                { source: 'header', field: 'bookingtitle', label: 'Title', width: 200, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'text' },
                { source: 'header', field: 'created_at', label: 'Created', width: 150, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'date' },
                { source: 'lineitem', field: 'sku', label: 'SKU', width: 140, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'text' },
                { source: 'lineitem', field: 'quantity', label: 'Qty', width: 70, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'number' },
                { source: 'lineitem', field: 'status', label: 'Status', width: 100, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'badge' },
                { source: 'lineitem', field: 'balanceref', label: 'Balance Ref', width: 100, sortable: true, filterable: true, visible: true, pinned: 'none', formatter: 'text' },
                { source: 'lineitem', field: 'overbooked', label: 'Overbooked', width: 100, sortable: false, filterable: false, visible: true, pinned: 'none', formatter: 'badge' },
                { source: 'lineitem', field: 'ref_imagelink', label: 'Image', width: 80, sortable: false, filterable: false, visible: false, pinned: 'none', formatter: 'image' },
                { source: 'lineitem', field: 'ref_model', label: 'Model', width: 120, sortable: true, filterable: true, visible: false, pinned: 'none', formatter: 'text' },
                { source: 'lineitem', field: 'ref_color', label: 'Color', width: 90, sortable: true, filterable: true, visible: false, pinned: 'none', formatter: 'text' },
                { source: 'lineitem', field: 'ref_size', label: 'Size', width: 70, sortable: true, filterable: true, visible: false, pinned: 'none', formatter: 'text' },
            ],
            options: {
                expandable: true,
                getItemLabel(item, index) {
                    const src = item?.source === 'lineitem' ? 'Line' : 'Hdr';
                    return `${item?.label || item?.field || 'Column ' + (index + 1)} [${src}]`;
                },
                item: {
                    source: {
                        label: { en: 'Source' },
                        type: 'TextSelect',
                        defaultValue: 'header',
                        options: {
                            options: [
                                { value: 'header', label: 'Header' },
                                { value: 'lineitem', label: 'Line Item' },
                            ],
                        },
                    },
                    field: {
                        label: { en: 'Field' },
                        type: 'Text',
                        defaultValue: '',
                        options: { placeholder: 'e.g. bookingnumber' },
                    },
                    label: {
                        label: { en: 'Label' },
                        type: 'Text',
                        defaultValue: '',
                        options: { placeholder: 'e.g. Booking #' },
                    },
                    width: {
                        label: { en: 'Width (px)' },
                        type: 'Number',
                        defaultValue: 150,
                        options: { min: 40, max: 800, step: 10 },
                    },
                    sortable: {
                        label: { en: 'Sortable' },
                        type: 'OnOff',
                        defaultValue: true,
                    },
                    filterable: {
                        label: { en: 'Filterable' },
                        type: 'OnOff',
                        defaultValue: true,
                    },
                    visible: {
                        label: { en: 'Visible' },
                        type: 'OnOff',
                        defaultValue: true,
                    },
                    pinned: {
                        label: { en: 'Pinned' },
                        type: 'TextSelect',
                        defaultValue: 'none',
                        options: {
                            options: [
                                { value: 'none', label: 'None' },
                                { value: 'left', label: 'Left' },
                                { value: 'right', label: 'Right' },
                            ],
                        },
                    },
                    formatter: {
                        label: { en: 'Format' },
                        type: 'TextSelect',
                        defaultValue: 'text',
                        options: {
                            options: [
                                { value: 'text', label: 'Text' },
                                { value: 'number', label: 'Number' },
                                { value: 'date', label: 'Date' },
                                { value: 'badge', label: 'Badge' },
                                { value: 'image', label: 'Image' },
                                { value: 'boolean', label: 'Boolean' },
                            ],
                        },
                    },
                },
            },
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Array of column configs: { source, field, label, width, sortable, filterable, visible, pinned, formatter }',
            },
            /* wwEditor:end */
        },

        /* ── Display ── */
        showFilterRow: {
            label: { en: 'Show filter row' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            responsive: true,
        },
        showGlobalSearch: {
            label: { en: 'Show global search' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            responsive: true,
        },
        tableMaxHeight: {
            label: { en: 'Table max height' },
            type: 'Text',
            section: 'settings',
            defaultValue: '600px',
            options: { placeholder: '600px or 80vh' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'CSS max-height for the scrollable table area (e.g. 600px, 80vh)' },
            /* wwEditor:end */
        },

        /* ── Pagination ── */
        paginationEnabled: {
            label: { en: 'Enable pagination' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
        },
        pageSize: {
            label: { en: 'Groups per page' },
            type: 'Number',
            section: 'settings',
            defaultValue: 25,
            options: { min: 5, max: 500, step: 5 },
            hidden: (content) => !content.paginationEnabled,
        },

        /* ── Selection ── */
        selectionEnabled: {
            label: { en: 'Enable selection' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
        },
        multiSelect: {
            label: { en: 'Multi-select' },
            type: 'OnOff',
            section: 'settings',
            defaultValue: true,
            hidden: (content) => !content.selectionEnabled,
        },

        /* ── Style: Colors ── */
        headerBgColor: {
            label: { en: 'Header background' },
            type: 'Color',
            section: 'style',
            defaultValue: '#f8f9fa',
        },
        headerTextColor: {
            label: { en: 'Header text' },
            type: 'Color',
            section: 'style',
            defaultValue: '#374151',
        },
        rowBgColor: {
            label: { en: 'Row background' },
            type: 'Color',
            section: 'style',
            defaultValue: '#ffffff',
        },
        rowAltBgColor: {
            label: { en: 'Alternate group background' },
            type: 'Color',
            section: 'style',
            defaultValue: '#fafbfc',
        },
        rowHoverColor: {
            label: { en: 'Row hover' },
            type: 'Color',
            section: 'style',
            defaultValue: '#f0f4ff',
        },
        selectedRowColor: {
            label: { en: 'Selected row' },
            type: 'Color',
            section: 'style',
            defaultValue: '#e0e7ff',
        },
        activeRowColor: {
            label: { en: 'Active row' },
            type: 'Color',
            section: 'style',
            defaultValue: '#ede9fe',
        },
        borderColor: {
            label: { en: 'Border color' },
            type: 'Color',
            section: 'style',
            defaultValue: '#e5e7eb',
        },
        groupSeparatorColor: {
            label: { en: 'Group separator' },
            type: 'Color',
            section: 'style',
            defaultValue: '#d1d5db',
        },

        /* ── Style: Typography ── */
        fontFamily: {
            label: { en: 'Font family' },
            type: 'FontFamily',
            section: 'style',
            defaultValue: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        fontSize: {
            label: { en: 'Font size' },
            type: 'Length',
            section: 'style',
            responsive: true,
            defaultValue: '13px',
            options: { unitChoices: [{ value: 'px', label: 'px', min: 10, max: 20 }] },
        },
        headerFontWeight: {
            label: { en: 'Header font weight' },
            type: 'TextSelect',
            section: 'style',
            defaultValue: '600',
            options: {
                options: [
                    { value: '400', label: 'Normal' },
                    { value: '500', label: 'Medium' },
                    { value: '600', label: 'Semi-bold' },
                    { value: '700', label: 'Bold' },
                ],
            },
        },

        /* ── Style: Density ── */
        rowDensity: {
            label: { en: 'Row density' },
            type: 'TextSelect',
            section: 'style',
            defaultValue: 'normal',
            options: {
                options: [
                    { value: 'compact', label: 'Compact' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'comfortable', label: 'Comfortable' },
                ],
            },
        },
        cellPadding: {
            label: { en: 'Cell padding' },
            type: 'Text',
            section: 'style',
            defaultValue: '',
            options: { placeholder: 'Auto (based on density)' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'CSS padding for cells, e.g. "8px 12px". Leave empty to use density default.' },
            /* wwEditor:end */
        },

        /* ── Style: Conditional ── */
        overbookedHighlight: {
            label: { en: 'Overbooked highlight color' },
            type: 'Color',
            section: 'style',
            defaultValue: '#fef2f2',
            /* wwEditor:start */
            propertyHelp: { tooltip: 'Background color for rows where overbooked = true' },
            /* wwEditor:end */
        },
        statusColorMap: {
            label: { en: 'Status → color map (JSON)' },
            type: 'RawObject',
            section: 'style',
            bindable: true,
            defaultValue: {
                Booked: '#dbeafe',
                Confirmed: '#d1fae5',
                Pending: '#fef3c7',
                Cancelled: '#fee2e2',
            },
            options: { placeholder: '{ "Booked": "#dbeafe", "Confirmed": "#d1fae5" }' },
            /* wwEditor:start */
            bindingValidation: {
                type: 'object',
                tooltip: 'Map of status value → CSS background color',
            },
            /* wwEditor:end */
        },
    },
};
