export default {
    editor: {
        label: { en: 'Booking Sheet Table' },
        icon: 'data',
        customSettingsPropertiesOrder: [
            {
                label: 'Data Sources',
                isCollapsible: true,
                properties: ['headerData', 'lineItemData', 'picReference', 'skuReference'],
            },
            {
                label: 'Display',
                isCollapsible: true,
                properties: ['tableMaxHeight'],
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
                    'statusColorMap',
                ],
            },
            {
                label: 'Typography',
                isCollapsible: true,
                properties: ['fontFamily', 'fontSize'],
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
        },
        {
            name: 'activeHeaderChange',
            label: { en: 'On Active Header Change' },
            event: { value: { header: null, lineItems: [] } },
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
    ],
    properties: {
        headerData: {
            label: { en: 'Booking Headers' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Bind to booking_headers_overview: { id, bookingnumber, created_at, bookingtitle, pic_id, status, unique_skus, total_quantity }',
            },
            /* wwEditor:end */
        },
        lineItemData: {
            label: { en: 'Booking Line Items' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Bind to booking_items_overview: { id, headerid, sku, quantity, status, balanceref, indicator }',
            },
            /* wwEditor:end */
        },
        picReference: {
            label: { en: 'PIC Reference (Teammates)' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Bind to teammates: { id, name }',
            },
            /* wwEditor:end */
        },
        skuReference: {
            label: { en: 'SKU Reference (Inventory)' },
            type: 'ObjectList',
            section: 'settings',
            bindable: true,
            defaultValue: [],
            /* wwEditor:start */
            bindingValidation: {
                type: 'array',
                tooltip: 'Bind to inventory_data: { sku, imagelink }',
            },
            /* wwEditor:end */
        },

        tableMaxHeight: {
            label: { en: 'Table max height' },
            type: 'Text',
            section: 'settings',
            defaultValue: '600px',
            options: { placeholder: '600px or 80vh' },
        },

        headerBgColor: { label: { en: 'Header background' }, type: 'Color', section: 'style', defaultValue: '#f8f9fa' },
        headerTextColor: { label: { en: 'Header text' }, type: 'Color', section: 'style', defaultValue: '#374151' },
        rowBgColor: { label: { en: 'Row background' }, type: 'Color', section: 'style', defaultValue: '#ffffff' },
        rowAltBgColor: { label: { en: 'Alternate group bg' }, type: 'Color', section: 'style', defaultValue: '#fafbfc' },
        rowHoverColor: { label: { en: 'Row hover' }, type: 'Color', section: 'style', defaultValue: '#f0f7ff' },
        borderColor: { label: { en: 'Border color' }, type: 'Color', section: 'style', defaultValue: '#e5e7eb' },
        statusColorMap: {
            label: { en: 'Status color map (JSON)' },
            type: 'RawObject',
            section: 'style',
            bindable: true,
            defaultValue: {
                'Booked': '#dbeafe',
                'Issue Raised': '#fee2e2',
                'Processing': '#fef9c3',
                'Delivered to Production': '#f3e8ff',
                'Delivered to Client': '#dcfce7',
                'Released': '#f3f4f6',
            },
            options: { placeholder: '{ "Booked": "#dbeafe" }' },
        },

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
    },
};
