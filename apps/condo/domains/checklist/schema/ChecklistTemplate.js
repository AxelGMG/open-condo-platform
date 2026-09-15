const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/checklist/access/ChecklistTemplate')
const {
    CHECKLIST_CATEGORIES,
    CHECKLIST_RECURRENCE_TYPES,
} = require('@condo/domains/checklist/constants/common')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const ChecklistTemplate = new GQLListSchema('ChecklistTemplate', {
    schemaDoc: 'Template used to generate operational checklists for an organization',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        name: {
            schemaDoc: 'Checklist template name',
            type: 'Text',
            isRequired: true,
        },

        description: {
            schemaDoc: 'Optional description of the checklist template',
            type: 'Text',
            isRequired: false,
        },

        category: {
            schemaDoc: 'Operational category of the checklist template',
            type: 'Select',
            options: CHECKLIST_CATEGORIES,
            isRequired: true,
        },

        recurrenceType: {
            schemaDoc: 'Recurrence type used to schedule checklist generation',
            type: 'Select',
            options: CHECKLIST_RECURRENCE_TYPES,
            isRequired: true,
        },

        recurrenceConfig: {
            schemaDoc: 'Optional configuration for the checklist recurrence',
            type: 'Json',
            isRequired: false,
        },

        isActive: {
            schemaDoc: 'Indicates whether the checklist template is active',
            type: 'Checkbox',
            defaultValue: true,
            isRequired: true,
            kmigratorOptions: { default: true },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadChecklistTemplates,
        create: access.canManageChecklistTemplates,
        update: access.canManageChecklistTemplates,
        delete: false,
        auth: true,
    },
})

module.exports = {
    ChecklistTemplate,
}
