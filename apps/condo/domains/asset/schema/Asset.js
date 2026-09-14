const { generateUUIDv4 } = require('@open-condo/miniapp-utils')
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

const {
    ORGANIZATION_OWNED_FIELD,
} = require('@condo/domains/organization/schema/fields')
const {
    ASSET_TYPES,
    ASSET_STATUSES,
} = require('@condo/domains/asset/constants/common')
const access = require('@condo/domains/asset/access/Asset')


const QR_TOKEN_ACCESS = {
    read: true,
    create: () => false,
    update: false,
}

const Asset = new GQLListSchema('Asset', {
    schemaDoc: 'Physical asset managed by an organization within a property',

    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        property: {
            schemaDoc: 'Property where the asset is located',
            type: 'Relationship',
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        assetType: {
            schemaDoc: 'Type of physical asset',
            type: 'Select',
            options: ASSET_TYPES,
            isRequired: true,
        },

        name: {
            schemaDoc: 'Asset name',
            type: 'Text',
            isRequired: true,
        },

        qrToken: {
            schemaDoc: 'Unique QR token used to identify the asset',
            type: 'Uuid',
            isRequired: true,
            defaultValue: () => generateUUIDv4(),
            kmigratorOptions: { null: false, unique: true },
            access: QR_TOKEN_ACCESS,
        },

        status: {
            schemaDoc: 'Current asset status',
            type: 'Select',
            options: ASSET_STATUSES,
            isRequired: true,
        },

        serialNumber: {
            schemaDoc: 'Asset serial number',
            type: 'Text',
            isRequired: false,
        },

        installedAt: {
            schemaDoc: 'When the asset was installed',
            type: 'DateTimeUtc',
            isRequired: false,
        },
    },

    plugins: [
        uuided(),
        versioned(),
        tracked(),
        softDeleted(),
        dvAndSender(),
        historical(),
        analytical(),
    ],

    access: {
        read: access.canReadAssets,
        create: access.canManageAssets,
        update: access.canManageAssets,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Asset,
}
