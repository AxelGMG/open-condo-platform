const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/checklist/access/Checklist')
const {
    CHECKLIST_STATUSES,
    CHECKLIST_STATUS_PENDING,
} = require('@condo/domains/checklist/constants/common')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const Checklist = new GQLListSchema('Checklist', {
    schemaDoc: 'Scheduled operational checklist generated from a checklist template',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        template: {
            schemaDoc: 'Checklist template used to generate this checklist',
            type: 'Relationship',
            ref: 'ChecklistTemplate',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        property: {
            schemaDoc: 'Optional property where the checklist should be performed',
            type: 'Relationship',
            ref: 'Property',
            isRequired: false,
            knexOptions: { isNotNullable: false },
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },

        scheduledFor: {
            schemaDoc: 'Date and time when the checklist is scheduled',
            type: 'DateTimeUtc',
            isRequired: true,
        },

        shift: {
            schemaDoc: 'Optional operational shift associated with the checklist',
            type: 'Text',
            isRequired: false,
        },

        status: {
            schemaDoc: 'Current checklist status',
            type: 'Select',
            options: CHECKLIST_STATUSES,
            defaultValue: CHECKLIST_STATUS_PENDING,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadChecklists,
        create: access.canManageChecklists,
        update: access.canManageChecklists,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Checklist,
}
