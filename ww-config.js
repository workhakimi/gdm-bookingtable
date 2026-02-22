export default {
    editor: {
        label: { en: 'Booking Sheet Table' },
        icon: 'data',
        customSettingsPropertiesOrder: [
            {
                label: 'Data Sources',
                isCollapsible: true,
                properties: ['headerData', 'lineItemData'],
            },
            {
                label: 'Relationship Mapping',
                isCollapsible: true,
                properties: ['headerKeyField', 'lineItemForeignKey'],
            },
            {
                label: 'Table Columns',
                isCollapsible: true,
                properties: ['columns'],
            },
            {
                label: 'Display',
                isCollapsible: true,
                properties: ['showGlobalSearch', 'tableMaxHeight'],
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
            event: { value: { header: {}, lineItem: {} } },
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
            event: { value: { header: null, lineItems: [] } },
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
        { action: 'addColumn', label: { en: 'Add column' } },
        {
            action: 'removeColumn',
            label: { en: 'Remove column' },
            args: [{ name: 'index', type: 'number', label: { en: 'Column index' } }],
        },
        {
            action: 'moveColumnUp',
            label: { en: 'Move column up' },
            args: [{ name: 'index', type: 'number', label: { en: 'Column index' } }],
        },
        {
            action: 'moveColumnDown',
            label: { en: 'Move column down' },
            args: [{ name: 'index', type: 'number', label: { en: 'Column index' } }],
        },
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
        headerData: {
            label: { en: 'Header Data' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Array of header/parent objects. Must contain a unique key field (e.g. id).',
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
                tooltip: 'Array of child/line item objects. Must contain a foreign key linking to Header Data.',
            },
            /* wwEditor:end */
        },

        headerKeyField: {
            label: { en: 'Header, ID Key' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'id',
            options: { placeholder: 'id' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'The unique identifier field in your Header Data (e.g. id, booking_id).' },
            /* wwEditor:end */
        },
        lineItemForeignKey: {
            label: { en: 'Line Item, Header ID Key' },
            type: 'Text',
            section: 'settings',
            defaultValue: 'headerid',
            options: { placeholder: 'headerid' },
            /* wwEditor:start */
            propertyHelp: { tooltip: 'The field in Line Items Data that references the Header ID (e.g. headerid, booking_id).' },
            /* wwEditor:end */
        },

        columns: {
            label: { en: 'Table Columns' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            options: {
                expandable: true,
                getItemLabel(item, index) {
                    const src = item?.source === 'lineitem' ? 'Line' : 'Hdr';
                    const display = item?.title?.trim() || item?.field || 'Column ' + (index + 1);
                    const idx = item?.index != null ? item.index : index;
                    return `${idx}. ${display} [${src}]`;
                },
                add: 'addColumn',
                remove: 'removeColumn',
                movable: true,
                moveUp: 'moveColumnUp',
                moveDown: 'moveColumnDown',
                item: {
                    type: 'Object',
                    options: {
                        item: {
                            index: {
                                label: { en: 'Index' },
                                type: 'Number',
                                defaultValue: 0,
                                options: { min: 0, step: 1 },
                            },
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
                                label: { en: 'Field Key' },
                                type: 'Text',
                                defaultValue: '',
                                options: { placeholder: 'e.g. bookingnumber' },
                            },
                            title: {
                                label: { en: 'Title Override' },
                                type: 'Text',
                                defaultValue: '',
                                options: { placeholder: 'Leave empty to use field key' },
                            },
                            width: {
                                label: { en: 'Width (px)' },
                                type: 'Number',
                                defaultValue: 150,
                                options: { min: 40, max: 800, step: 10 },
                            },
                            formatter: {
                                label: { en: 'Display Format' },
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
                            visible: {
                                label: { en: 'Visible' },
                                type: 'OnOff',
                                defaultValue: true,
                            },
                            displayValueFormula: {
                                label: { en: 'Display value override' },
                                type: 'Formula',
                                /* wwEditor:start */
                                propertyHelp: { tooltip: 'Optional formula to override the cell display. Context is the current row (header or line item). Use context fields or mapping to compute the displayed value.' },
                                /* wwEditor:end */
                                options: (content) => {
                                    try {
                                        const headers = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
                                            ? (wwLib.wwUtils.getDataFromCollection(content?.headerData) ?? [])
                                            : [];
                                        const lines = typeof wwLib !== 'undefined' && wwLib?.wwUtils?.getDataFromCollection
                                            ? (wwLib.wwUtils.getDataFromCollection(content?.lineItemData) ?? [])
                                            : [];
                                        const first = (Array.isArray(headers) && headers[0]) || (Array.isArray(lines) && lines[0]) || {};
                                        return { template: first };
                                    } catch (_) {
                                        return { template: {} };
                                    }
                                },
                            },
                        },
                    },
                },
            },
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Array of column configs: { source, field, title?, width?, formatter?, visible?, displayValueFormula? }',
            },
            /* wwEditor:end */
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

        headerBgColor: { label: { en: 'Header background' }, type: 'Color', section: 'style', defaultValue: '#f8f9fa' },
        headerTextColor: { label: { en: 'Header text' }, type: 'Color', section: 'style', defaultValue: '#374151' },
        rowBgColor: { label: { en: 'Row background' }, type: 'Color', section: 'style', defaultValue: '#ffffff' },
        rowAltBgColor: { label: { en: 'Alternate group background' }, type: 'Color', section: 'style', defaultValue: '#fafbfc' },
        rowHoverColor: { label: { en: 'Row hover' }, type: 'Color', section: 'style', defaultValue: '#f0f4ff' },
        selectedRowColor: { label: { en: 'Selected row' }, type: 'Color', section: 'style', defaultValue: '#e0e7ff' },
        activeRowColor: { label: { en: 'Active row' }, type: 'Color', section: 'style', defaultValue: '#ede9fe' },
        borderColor: { label: { en: 'Border color' }, type: 'Color', section: 'style', defaultValue: '#e5e7eb' },
        groupSeparatorColor: { label: { en: 'Group separator' }, type: 'Color', section: 'style', defaultValue: '#d1d5db' },

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
            label: { en: 'Status color map (JSON)' },
            type: 'RawObject',
            section: 'style',
            bindable: true,
            defaultValue: {},
            options: { placeholder: '{ "Booked": "#dbeafe", "Confirmed": "#d1fae5" }' },
            /* wwEditor:start */
            bindingValidation: {
                type: 'object',
                tooltip: 'Map of value to CSS background color (e.g. status name to color)',
            },
            /* wwEditor:end */
        },
    },
};
