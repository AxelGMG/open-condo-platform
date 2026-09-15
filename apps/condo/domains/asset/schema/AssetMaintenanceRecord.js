const {
    historical,
    versioned,
    uuided,
    tracked,
    softDeleted,
    dvAndSender,
    analytical,
} = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const { addOrganizationFieldPlugin } = require('@condo/domains/organization/schema/plugins/addOrganizationFieldPlugin')
const access = require('@condo/domains/asset/access/AssetMaintenanceRecord')


const AssetMaintenanceRecord = new GQLListSchema('AssetMaintenanceRecord', {
    schemaDoc: 'Maintenance record associated with a physical asset',

    fields: {
        asset: {
            schemaDoc: 'Asset that received maintenance',
            type: 'Relationship',
            ref: 'Asset',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        performedAt: {
            schemaDoc: 'When the maintenance was performed',
            type: 'DateTimeUtc',
            isRequired: true,
        },

        notes: {
            schemaDoc: 'Maintenance notes',
            type: 'Text',
            isRequired: false,
        },

        employee: {
            schemaDoc: 'Employee associated with the maintenance',
            type: 'Relationship',
            ref: 'OrganizationEmployee',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
    },

    plugins: [
        addOrganizationFieldPlugin({
            fromField: 'asset',
            isRequired: true,
        }),
        uuided(),
        versioned(),
        tracked(),
        softDeleted(),
        dvAndSender(),
        historical(),
        analytical(),
    ],

    access: {
        read: access.canReadAssetMaintenanceRecords,
        create: access.canManageAssetMaintenanceRecords,
        update: access.canManageAssetMaintenanceRecords,
        delete: false,
        auth: true,
    },
})

module.exports = {
    AssetMaintenanceRecord,
}
